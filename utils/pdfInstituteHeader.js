const path = require('path')
const fs = require('fs')

const PAGE_MARGIN = 45
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2

// Update the logo path / college name here once — every PDF generator that
// calls drawInstitutionalHeader stays in sync automatically.
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png')

function drawInstitutionalHeader(doc, { departmentName, pdfHeading }) {
  const startY = doc.y
  const logoSize = 55
  const textWidth = CONTENT_WIDTH - (logoSize + 10) * 2

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, PAGE_MARGIN, startY, { width: logoSize, height: logoSize })
    } catch (err) {
      // Corrupt/unsupported image — skip rather than crash PDF generation
    }
  }

  doc.font('Times-Bold').fontSize(15).fillColor('red')
    .text('BMS Institute of Technology & Management', PAGE_MARGIN + logoSize + 10, startY, {
      width: textWidth,
      align: 'center',
    })
  doc.font('Times-Roman').fontSize(9).fillColor('black')
  doc.text('(An Autonomous Institution Affiliated to VTU, Belagavi)', { width: textWidth, align: 'center' })
  doc.text('Avalahalli, Doddaballapur Main Road, Yelahanka, Bengaluru – 560 119', { width: textWidth, align: 'center' })

  doc.y = Math.max(doc.y, startY + logoSize) + 8
  doc.x = PAGE_MARGIN

  if (departmentName) {
    doc.font('Times-Bold').fontSize(12).fillColor('red')
      .text(departmentName, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, align: 'center' })
    doc.moveDown(0.2)
  }

  if (pdfHeading) {
    doc.font('Times-Bold').fontSize(13).fillColor('black')
      .text(pdfHeading, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, align: 'center', underline: true })
    doc.moveDown(0.5)
  }

  doc.fillColor('black')
}

module.exports = { drawInstitutionalHeader, PAGE_MARGIN, CONTENT_WIDTH }