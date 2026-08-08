const PDFDocument = require('pdfkit')

// Splits a USN like "1BY23IS001" into a letter/digit prefix ("1BY23IS")
// and a trailing number (1), so runs of consecutive students can be detected.
function parseUSN(usn) {
  const match = /^(.*\D)(\d+)$/.exec(usn || '')
  if (!match) return null
  return { prefix: match[1], number: parseInt(match[2], 10) }
}

// For one proctor's set of students, finds the single largest contiguous
// USN run (same prefix, consecutive numbers) and treats everyone else
// assigned to that proctor as an "extra" addition.
function groupProctorUSNs(students) {
  const parsed = students
    .map((s) => ({ ...s, parsed: parseUSN(s.USN) }))
    .filter((s) => s.parsed)

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
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2 // A4 portrait width minus margins

function drawLetterhead(doc, { departmentName, title, subtitle }) {
  doc.font('Helvetica-Bold').fontSize(16).text('BMS Institute of Technology and Management', PAGE_MARGIN, doc.y, {
    align: 'center',
    width: CONTENT_WIDTH,
  })
  doc.font('Helvetica').fontSize(9)
  doc.text('(Autonomous Under VTU)', { align: 'center' })
  doc.text('(Accredited By National Assessment & Accreditation Council (NAAC))', { align: 'center' })
  doc.text('(Approved by AICTE, New Delhi & Affiliated to Visvesvaraya Technological University, Belagavi)', { align: 'center' })
  doc.text('Doddaballapura Main Road, Avalahalli, Yelahanka, Bengaluru-560064', { align: 'center' })
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').fontSize(11).text(departmentName, { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(11).text(title, { align: 'center' })
  if (subtitle) {
    doc.fontSize(11).text(subtitle, { align: 'center' })
  }
  doc.moveDown(0.7)
}

function drawSummaryTable(doc, rows) {
  const colWidths = [30, 70, 180, 60, 155]
  const colLabels = ['Sl.\nNo', 'Section', 'USN From - To', 'No of\nStudents', 'Proctor Details']
  const startX = PAGE_MARGIN

  const drawHeader = () => {
    let x = startX
    doc.font('Helvetica-Bold').fontSize(8)
    const headerY = doc.y
    colLabels.forEach((label, i) => {
      doc.rect(x, headerY, colWidths[i], 22).stroke()
      doc.text(label, x + 3, headerY + 4, { width: colWidths[i] - 6 })
      x += colWidths[i]
    })
    doc.y = headerY + 22
  }

  drawHeader()

  doc.font('Helvetica').fontSize(8)
  rows.forEach((row, idx) => {
    const rangeText = row.rangeFrom
      ? `${row.rangeFrom} - ${row.rangeTo}${row.extras.length ? '\n' + row.extras.map((e) => `${e.StudentName} (${e.USN})`).join(', ') : ''}`
      : row.extras.map((e) => `${e.StudentName} (${e.USN})`).join(', ')
    const countText = row.extras.length
      ? `${row.rangeCount}+${row.extras.length}\n=${row.totalCount}`
      : `${row.totalCount}`
    const proctorText = `${row.FacultyName}\n${row.Phone || ''}\n${row.Email || ''}`

    const cellTexts = [String(idx + 1), row.Section, rangeText, countText, proctorText]
    const rowHeights = cellTexts.map((text, i) => doc.heightOfString(text, { width: colWidths[i] - 6 }))
    const rowHeight = Math.max(...rowHeights) + 8

    if (doc.y + rowHeight > doc.page.height - PAGE_MARGIN - 60) {
      doc.addPage()
      doc.y = PAGE_MARGIN
      drawHeader()
    }

    let x = startX
    const rowY = doc.y
    cellTexts.forEach((text, i) => {
      doc.rect(x, rowY, colWidths[i], rowHeight).stroke()
      doc.text(text, x + 3, rowY + 4, { width: colWidths[i] - 6 })
      x += colWidths[i]
    })
    doc.y = rowY + rowHeight
  })

  doc.moveDown(1)
}

function drawDetailTables(doc, divisions) {
  const colWidths = [55, 40, 90, 175, 135]
  const colLabels = ['Division', 'Sl.No', 'USN', 'Proctee Name', 'Proctor Name']
  const startX = PAGE_MARGIN
  const rowHeight = 15

  const drawHeader = () => {
    let x = startX
    doc.font('Helvetica-Bold').fontSize(8)
    const headerY = doc.y
    colLabels.forEach((label, i) => {
      doc.rect(x, headerY, colWidths[i], 18).stroke()
      doc.text(label, x + 3, headerY + 5, { width: colWidths[i] - 6 })
      x += colWidths[i]
    })
    doc.y = headerY + 18
  }

  doc.addPage()
  doc.y = PAGE_MARGIN
  drawHeader()
  doc.font('Helvetica').fontSize(8)

  divisions.forEach((division) => {
    let slNo = 1
    division.proctorBlocks.forEach((block) => {
      const blockStartY = doc.y

      block.students.forEach((student) => {
        if (doc.y + rowHeight > doc.page.height - PAGE_MARGIN) {
          doc.addPage()
          doc.y = PAGE_MARGIN
          drawHeader()
        }
        const rowY = doc.y
        doc.rect(startX, rowY, colWidths[0], rowHeight).stroke()
        doc.rect(startX + colWidths[0], rowY, colWidths[1], rowHeight).stroke()
        doc.rect(startX + colWidths[0] + colWidths[1], rowY, colWidths[2], rowHeight).stroke()
        doc.rect(startX + colWidths[0] + colWidths[1] + colWidths[2], rowY, colWidths[3], rowHeight).stroke()

        doc.text(division.name, startX + 3, rowY + 4, { width: colWidths[0] - 6 })
        doc.text(String(slNo), startX + colWidths[0] + 3, rowY + 4, { width: colWidths[1] - 6 })
        doc.text(student.USN, startX + colWidths[0] + colWidths[1] + 3, rowY + 4, { width: colWidths[2] - 6 })
        doc.text(student.StudentName, startX + colWidths[0] + colWidths[1] + colWidths[2] + 3, rowY + 4, {
          width: colWidths[3] - 6,
        })

        doc.y = rowY + rowHeight
        slNo++
      })

      // Proctor Name column drawn once per block, vertically spanning that block's rows
      const blockEndY = doc.y
      const proctorColX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
      doc.rect(proctorColX, blockStartY, colWidths[4], blockEndY - blockStartY).stroke()
      const proctorText = `${block.FacultyName}\n${block.Phone || ''}\n${block.Email || ''}\n(${block.students.length})`
      const textHeight = doc.heightOfString(proctorText, { width: colWidths[4] - 6 })
      const centeredY = blockStartY + Math.max(4, (blockEndY - blockStartY - textHeight) / 2)
      doc.text(proctorText, proctorColX + 3, centeredY, { width: colWidths[4] - 6, align: 'center' })
    })
  })
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
  doc.font('Helvetica-Bold').fontSize(9)
  labels.forEach((label, i) => {
    doc.text(label, PAGE_MARGIN + i * colWidth, y, { width: colWidth, align: 'center' })
  })
}

// Main entry point. Returns a PDFDocument stream ready to pipe to a response.
function generateProctorReportPdf({ semester, academicYear, term, divisions }) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' })

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

  drawDetailTables(doc, divisions)
  drawSignatures(doc)

  doc.end()
  return doc
}

module.exports = { generateProctorReportPdf }