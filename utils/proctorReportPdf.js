const PDFDocument = require('pdfkit')

function parseUSN(usn) {
  const match = /^(.*\D)(\d+)$/.exec(usn || '')
  if (!match) return null
  return { prefix: match[1], number: parseInt(match[2], 10) }
}

function groupProctorUSNs(students) {
  const parsed = students.map((s) => ({ ...s, parsed: parseUSN(s.USN) })).filter((s) => s.parsed)
  const byPrefix = {}
  parsed.forEach((s) => {
    byPrefix[s.parsed.prefix] = byPrefix[s.parsed.prefix] || []
    byPrefix[s.parsed.prefix].push(s)
  })
  let bestRun = []
  Object.values(byPrefix).forEach((group) => {
    group.sort((a, b) => a.parsed.number - b.parsed.number)
    let runStart = 0
    for (let i = 1; i <= group.length; i++) {
      const brokeRun = i === group.length || group[i].parsed.number !== group[i - 1].parsed.number + 1
      if (brokeRun) {
        const run = group.slice(runStart, i)
        if (run.length > bestRun.length) bestRun = run
        runStart = i
      }
    }
  })
  const bestRunUSNs = new Set(bestRun.map((s) => s.USN))
  const extras = parsed.filter((s) => !bestRunUSNs.has(s.USN)).sort((a, b) => a.USN.localeCompare(b.USN))
  return {
    rangeFrom: bestRun[0]?.USN || null,
    rangeTo: bestRun[bestRun.length - 1]?.USN || null,
    rangeCount: bestRun.length,
    extras: extras.map((s) => ({ USN: s.USN, StudentName: s.StudentName })),
    totalCount: students.length,
  }
}

const PAGE_MARGIN = 45
const PAGE_WIDTH = 595.28 // A4 portrait
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2

// PDFKit's built-in standard fonts don't include true "Times New Roman" —
// Times-Roman is the closest built-in serif equivalent, no extra font
// files needed. Swap these two constants for a custom .ttf path + doc.registerFont(...)
// if an exact Times New Roman match is ever required.
const BODY_FONT = 'Times-Roman'
const BODY_FONT_SIZE = 9
const HEADER_FONT = 'Times-Bold'
const HEADER_FONT_SIZE = 9

function drawLetterhead(doc, { departmentName, title, subtitle }) {
  doc.font('Times-Bold').fontSize(16).text('BMS Institute of Technology and Management', PAGE_MARGIN, doc.y, {
    align: 'center',
    width: CONTENT_WIDTH,
  })
  doc.font('Times-Roman').fontSize(9)
  doc.text('(Autonomous Under VTU)', { align: 'center' })
  doc.text('(Accredited By National Assessment & Accreditation Council (NAAC))', { align: 'center' })
  doc.text('(Approved by AICTE, New Delhi & Affiliated to Visvesvaraya Technological University, Belagavi)', { align: 'center' })
  doc.text('Doddaballapura Main Road, Avalahalli, Yelahanka, Bengaluru-560064', { align: 'center' })
  doc.moveDown(0.5)
  doc.font('Times-Bold').fontSize(11).text(departmentName, { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(11).text(title, { align: 'center' })
  if (subtitle) doc.fontSize(11).text(subtitle, { align: 'center' })
  doc.moveDown(0.7)
}

function contactBlock(name, phone, email, extraLine) {
  return [name, phone, email, extraLine].filter(Boolean).join('\n')
}

/**
 * Draws a table with optional rowspan-merged columns, using PDFKit's
 * bufferPages + switchToPage so merges stay correct even when a group of
 * equal values spans a page break. A merged group never straddles a page
 * break — it closes out at the bottom of one page and restarts fresh on
 * the next.
 *
 * columns: [{ label, width, mergeKey? }]
 * rows:    [{ cells: [text,...], mergeValues: { colIndex: value } }]
 */
function drawMergeableTable(doc, { columns, rows, drawHeader }) {
  const startX = PAGE_MARGIN
  const mergeColIndexes = columns.map((c, i) => (c.mergeKey ? i : null)).filter((i) => i !== null)

  const openGroups = {}
  const finishedGroups = []

  const closeGroup = (colIndex) => {
    const g = openGroups[colIndex]
    if (!g) return
    finishedGroups.push({ colIndex, ...g })
    delete openGroups[colIndex]
  }

  drawHeader(doc, startX)

  rows.forEach((row) => {
    doc.font(BODY_FONT).fontSize(BODY_FONT_SIZE)
    const cellHeights = row.cells.map((text, i) => doc.heightOfString(text || '', { width: columns[i].width - 6 }))
    const rowHeight = Math.max(...cellHeights, 14) + 10

    const pageBottom = doc.page.height - PAGE_MARGIN
    if (doc.y + rowHeight > pageBottom) {
      mergeColIndexes.forEach(closeGroup)
      doc.addPage()
      doc.y = PAGE_MARGIN
      drawHeader(doc, startX)
      doc.font(BODY_FONT).fontSize(BODY_FONT_SIZE)
    }

    const rowY = doc.y
    const pageIndex = doc.bufferedPageRange().count - 1

    let x = startX
    row.cells.forEach((text, i) => {
      const isMerged = mergeColIndexes.includes(i)
      if (!isMerged) {
        doc.rect(x, rowY, columns[i].width, rowHeight).stroke()
        doc.text(text || '', x + 3, rowY + 5, { width: columns[i].width - 6 })
      } else {
        const value = row.mergeValues[i]
        const g = openGroups[i]
        if (!g) {
          openGroups[i] = { startPage: pageIndex, startY: rowY, endY: rowY + rowHeight, value, x, width: columns[i].width }
        } else if (g.value === value && g.startPage === pageIndex) {
          g.endY = rowY + rowHeight
        } else {
          closeGroup(i)
          openGroups[i] = { startPage: pageIndex, startY: rowY, endY: rowY + rowHeight, value, x, width: columns[i].width }
        }
      }
      x += columns[i].width
    })

    doc.y = rowY + rowHeight
  })

  mergeColIndexes.forEach(closeGroup)

  const lastPageIndex = doc.bufferedPageRange().count - 1
  finishedGroups.forEach((g) => {
    doc.switchToPage(g.startPage)
    doc.rect(g.x, g.startY, g.width, g.endY - g.startY).stroke()
    doc.font(BODY_FONT).fontSize(BODY_FONT_SIZE)
    const textHeight = doc.heightOfString(g.value || '', { width: g.width - 6 })
    const centeredY = g.startY + Math.max(4, (g.endY - g.startY - textHeight) / 2)
    doc.text(g.value || '', g.x + 3, centeredY, { width: g.width - 6, align: 'center' })
  })

  doc.switchToPage(lastPageIndex)
}

function drawSummaryTable(doc, summaryRows) {
  const columns = [
    { label: 'Sl.\nNo', width: 30 },
    { label: 'Section', width: 65, mergeKey: true },
    { label: 'USN From - To', width: 185 },
    { label: 'No of\nStudents', width: 60 },
    { label: 'Proctor Details', width: 165 },
  ]

  const drawHeader = (doc, startX) => {
    let x = startX
    doc.font(HEADER_FONT).fontSize(HEADER_FONT_SIZE)
    const headerY = doc.y
    columns.forEach((col) => {
      doc.rect(x, headerY, col.width, 22).stroke()
      doc.text(col.label, x + 3, headerY + 4, { width: col.width - 6 })
      x += col.width
    })
    doc.y = headerY + 22
  }

  const rows = summaryRows.map((row, idx) => {
    const rangeText = row.rangeFrom
      ? `${row.rangeFrom} - ${row.rangeTo}` +
        (row.extras.length ? '\n' + row.extras.map((e) => `${e.StudentName} (${e.USN})`).join(', ') : '')
      : row.extras.map((e) => `${e.StudentName} (${e.USN})`).join(', ')
    const countText = row.extras.length ? `${row.rangeCount}+${row.extras.length}\n=${row.totalCount}` : `${row.totalCount}`
    const proctorText = contactBlock(row.FacultyName, row.Phone, row.Email)

    return {
      cells: [String(idx + 1), row.Section, rangeText, countText, proctorText],
      mergeValues: { 1: row.Section },
    }
  })

  drawMergeableTable(doc, { columns, rows, drawHeader })
  doc.moveDown(1)
}

function drawDetailTable(doc, divisions) {
  const columns = [
    { label: 'Division', width: 55, mergeKey: true },
    { label: 'Sl.No', width: 40 },
    { label: 'USN', width: 90 },
    { label: 'Proctee Name', width: 175 },
    { label: 'Proctor Name', width: 145, mergeKey: true },
  ]

  const drawHeader = (doc, startX) => {
    let x = startX
    doc.font(HEADER_FONT).fontSize(HEADER_FONT_SIZE)
    const headerY = doc.y
    columns.forEach((col) => {
      doc.rect(x, headerY, col.width, 18).stroke()
      doc.text(col.label, x + 3, headerY + 5, { width: col.width - 6 })
      x += col.width
    })
    doc.y = headerY + 18
  }

  const rows = []
  divisions.forEach((division) => {
    let slNo = 1
    division.proctorBlocks.forEach((block) => {
      const proctorLabel = contactBlock(block.FacultyName, block.Phone, block.Email, `(${block.students.length})`)
      block.students.forEach((student) => {
        rows.push({
          cells: [division.name, String(slNo), student.USN, student.StudentName, proctorLabel],
          mergeValues: { 0: division.name, 4: proctorLabel },
        })
        slNo++
      })
    })
  })

  doc.addPage()
  doc.y = PAGE_MARGIN
  drawMergeableTable(doc, { columns, rows, drawHeader })
}

function drawSignatures(doc) {
  if (doc.y > doc.page.height - PAGE_MARGIN - 80) {
    doc.addPage()
    doc.y = PAGE_MARGIN
  } else {
    doc.moveDown(3)
  }
  const labels = ['Proctor Coordinator', 'Cluster-4 Head', 'HOD']
  const colWidth = CONTENT_WIDTH / labels.length
  const y = doc.y + 30
  doc.font('Times-Bold').fontSize(9)
  labels.forEach((label, i) => {
    doc.text(label, PAGE_MARGIN + i * colWidth, y, { width: colWidth, align: 'center' })
  })
}

function generateProctorReportPdf({ semester, academicYear, term, divisions }) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true })

  drawLetterhead(doc, {
    departmentName: 'DEPARTMENT OF INFORMATION SCIENCE & ENGINEERING',
    title: `Proctor student allotment (AY: ${term || 'ODD'} SEM ${academicYear || ''})`,
    subtitle: `SEMESTER ${semester} (CLUSTER-4)`,
  })

  const summaryRows = []
  divisions.forEach((division) => {
    division.proctorBlocks.forEach((block) => {
      summaryRows.push({
        Section: division.name,
        FacultyName: block.FacultyName,
        Phone: block.Phone,
        Email: block.Email,
        ...groupProctorUSNs(block.students),
      })
    })
  })
  drawSummaryTable(doc, summaryRows)
  drawDetailTable(doc, divisions)
  drawSignatures(doc)

  doc.end()
  return doc
}

module.exports = { generateProctorReportPdf }