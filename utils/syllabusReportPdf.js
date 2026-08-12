const PDFDocument = require('pdfkit')
const { drawInstitutionalHeader, PAGE_MARGIN, CONTENT_WIDTH } = require('./pdfInstituteHeader')

function drawSectionHeading(doc, text) {
  doc.moveDown(0.6)
  doc.font('Times-Bold').fontSize(12).text(text, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH })
  doc.moveDown(0.3)
}

function drawTable(doc, { headers, rows, colWidths }) {
  const startX = PAGE_MARGIN
  let x = startX
  const headerY = doc.y
  doc.font('Times-Bold').fontSize(10)
  headers.forEach((h, i) => {
    doc.rect(x, headerY, colWidths[i], 20).stroke()
    doc.text(h, x + 4, headerY + 5, { width: colWidths[i] - 8 })
    x += colWidths[i]
  })
  doc.y = headerY + 20

  doc.font('Times-Roman').fontSize(10)
  rows.forEach((row) => {
    const cellHeights = row.map((text, i) => doc.heightOfString(text || '', { width: colWidths[i] - 8 }))
    const rowHeight = Math.max(...cellHeights, 14) + 10

    if (doc.y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage()
      doc.y = PAGE_MARGIN
    }

    let cx = startX
    const rowY = doc.y
    row.forEach((text, i) => {
      doc.rect(cx, rowY, colWidths[i], rowHeight).stroke()
      doc.text(text || '', cx + 4, rowY + 5, { width: colWidths[i] - 8 })
      cx += colWidths[i]
    })
    doc.y = rowY + rowHeight
  })
  doc.moveDown(0.8)
}

// Builds just the cover pages (header + Course Administrator Details +
// Prerequisites + "Module wise Syllabus" heading) as a Buffer. The actual
// uploaded syllabus PDF is merged onto the end of this by the route, since
// PDFKit can't embed another PDF's pages directly — pdf-lib handles that.
function generateSyllabusCoverPdf({ departmentName, course, facultyRows }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    drawInstitutionalHeader(doc, { departmentName, pdfHeading: 'SYLLABUS' })

    drawSectionHeading(doc, 'a) Course Administrator Details')
    drawTable(doc, {
      headers: ['Name of the Faculty', 'Designation', 'Mail ID'],
      rows: facultyRows.length
        ? facultyRows.map((f) => [f.Name || '-', f.Designation || '-', f.Email || '-'])
        : [['Not yet allocated in Course-Faculty Map', '-', '-']],
      colWidths: [190, 140, 175],
    })

    drawSectionHeading(doc, 'b) Prerequisites')
    drawTable(doc, {
      headers: ['Course Code', 'Course Name'],
      rows: [[course.CourseCode, course.CourseTitle]],
      colWidths: [150, 355],
    })

    drawSectionHeading(doc, 'c) Module wise Syllabus')
    doc.font('Times-Roman').fontSize(10)
      .text('The uploaded syllabus document follows on the next page.', PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH })

    doc.end()
  })
}

module.exports = { generateSyllabusCoverPdf }