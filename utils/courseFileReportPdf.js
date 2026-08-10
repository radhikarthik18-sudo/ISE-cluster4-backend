const PDFDocument = require('pdfkit')

const PAGE_MARGIN = 45
const PAGE_WIDTH = 595.28
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2

function drawLetterhead(doc, fileType) {
  doc.font('Times-Bold').fontSize(15).text('BMS INSTITUTE OF TECHNOLOGY & MANAGEMENT', PAGE_MARGIN, doc.y, {
    align: 'center',
    width: CONTENT_WIDTH,
  })
  doc.font('Times-Bold').fontSize(11).text('YELAHANKA, BENGALURU 64', { align: 'center' })
  doc.moveDown(0.4)
  doc.font('Times-Bold').fontSize(12).text('DEPARTMENT OF INFORMATION SCIENCE & ENGINEERING', { align: 'center' })
  doc.moveDown(0.4)
  doc.font('Times-Bold').fontSize(13).text(
    fileType === 'Laboratory' ? 'LABORATORY COURSE FILE CONTENTS' : 'THEORY COURSE FILE CONTENTS',
    { align: 'center', underline: true }
  )
  doc.moveDown(0.8)
}

function drawHeaderTable(doc, cf) {
  const rows = [
    ['Course Code', cf.CourseCode, 'Course Title', cf.CourseTitle],
    ['Semester', cf.Semester, 'Period', cf.Period],
    ['Academic Year', cf.AcademicYear, 'Batch', cf.Batch],
    ['Credits', cf.Credits, 'L:T:P', cf.LTP],
    ['CIE Marks', cf.CIEMarks, 'SEE Marks', cf.SEEMarks],
    ['Name of the Course Coordinator', cf.CourseCoordinatorName, '', ''],
  ]
  const colWidths = [140, 115, 140, 110]
  const startX = PAGE_MARGIN

  doc.font('Times-Roman').fontSize(10)
  rows.forEach((row) => {
    const isLastRow = row[2] === '' && row[3] === ''
    const rowHeight = 22
    const rowY = doc.y

    if (isLastRow) {
      doc.rect(startX, rowY, colWidths[0], rowHeight).stroke()
      doc.text(row[0], startX + 4, rowY + 6, { width: colWidths[0] - 8 })
      doc.rect(startX + colWidths[0], rowY, colWidths[1] + colWidths[2] + colWidths[3], rowHeight).stroke()
      doc.text(row[1] || '', startX + colWidths[0] + 4, rowY + 6, { width: colWidths[1] + colWidths[2] + colWidths[3] - 8 })
    } else {
      let x = startX
      row.forEach((cell, i) => {
        doc.rect(x, rowY, colWidths[i], rowHeight).stroke()
        doc.text(cell || '', x + 4, rowY + 6, { width: colWidths[i] - 8 })
        x += colWidths[i]
      })
    }
    doc.y = rowY + rowHeight
  })

  doc.moveDown(1)
}

function drawParticularsTable(doc, particulars, includeStatus) {
  const startX = PAGE_MARGIN
  const colWidths = includeStatus ? [40, 415, 50] : [40, 465]
  const labels = includeStatus ? ['Sl. No.', 'Particulars', 'Status'] : ['Sl. No.', 'Particulars']

  const drawHeader = () => {
    let x = startX
    doc.font('Times-Bold').fontSize(10)
    const headerY = doc.y
    labels.forEach((label, i) => {
      doc.rect(x, headerY, colWidths[i], 20).stroke()
      doc.text(label, x + 4, headerY + 5, { width: colWidths[i] - 8, align: i === 0 ? 'center' : 'left' })
      x += colWidths[i]
    })
    doc.y = headerY + 20
  }

  drawHeader()
  doc.font('Times-Roman').fontSize(10)

  particulars.forEach((p) => {
    const nameHeight = doc.heightOfString(p.Name, { width: colWidths[1] - 8 })
    const rowHeight = Math.max(nameHeight + 10, 20)

    if (doc.y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage()
      doc.y = PAGE_MARGIN
      drawHeader()
      doc.font('Times-Roman').fontSize(10)
    }

    const rowY = doc.y
    let x = startX
    doc.rect(x, rowY, colWidths[0], rowHeight).stroke()
    doc.text(String(p.SlNo), x + 4, rowY + 5, { width: colWidths[0] - 8, align: 'center' })
    x += colWidths[0]

    doc.rect(x, rowY, colWidths[1], rowHeight).stroke()
    doc.text(p.Name, x + 4, rowY + 5, { width: colWidths[1] - 8 })
    x += colWidths[1]

    if (includeStatus) {
      doc.rect(x, rowY, colWidths[2], rowHeight).stroke()
      doc.text(p.Status, x + 4, rowY + 5, { width: colWidths[2] - 8, align: 'center' })
    }

    doc.y = rowY + rowHeight
  })
}

function generateCourseFileIndexPdf(courseFile) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true })
  drawLetterhead(doc, courseFile.FileType)
  drawHeaderTable(doc, courseFile)
  drawParticularsTable(doc, courseFile.Particulars, true)
  doc.end()
  return doc
}

function generateParticularPdf(courseFile, particular) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' })
  drawLetterhead(doc, courseFile.FileType)
  drawHeaderTable(doc, courseFile)

  doc.moveDown(0.5)
  doc.font('Times-Bold').fontSize(12).text(`${particular.SlNo}. ${particular.Name}`, { width: CONTENT_WIDTH })
  doc.moveDown(0.3)
  doc.font('Times-Roman').fontSize(10).text(`Status: ${particular.Status}`, { width: CONTENT_WIDTH })
  doc.moveDown(0.5)

  doc.font('Times-Bold').fontSize(10).text('Details / Notes:', { width: CONTENT_WIDTH })
  doc.moveDown(0.2)
  doc.font('Times-Roman').fontSize(10).text(particular.Details || '(No details entered)', { width: CONTENT_WIDTH })

  doc.end()
  return doc
}

module.exports = { generateCourseFileIndexPdf, generateParticularPdf }