const express = require('express')
const router = express.Router()
const CourseFile = require('../models/courseFileModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')
const { buildDefaultParticulars } = require('../utils/courseFileParticulars')
const { generateCourseFileIndexPdf, generateParticularPdf } = require('../utils/courseFileReportPdf')
const { PDFDocument: PDFLibDocument } = require('pdf-lib')
const { generateSyllabusCoverPdf } = require('../utils/syllabusReportPdf')
const Course = require('../models/courseModel')
const CourseFacultyMap = require('../models/courseFacultyMapModel')
const Faculty = require('../models/facultyrecordmodels')
const ALLOWED_ROLES = ['Admin', 'HOD', 'Faculty', 'ChiefCourseCoordinator']

// GET /api/course-file?CourseCode=X
router.get('/', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { CourseCode } = req.query
    const cf = await CourseFile.findOne({ CourseCode })
    res.json(cf || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/course-file - initialize a course file (only if one doesn't already exist)
router.post('/', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { CourseCode, FileType } = req.body
    if (!CourseCode || !FileType) {
      return res.status(400).json({ error: 'CourseCode and FileType are required' })
    }

    const existing = await CourseFile.findOne({ CourseCode })
    if (existing) return res.status(200).json(existing)

    const newCourseFile = new CourseFile({
      ...req.body,
      Particulars: buildDefaultParticulars(FileType),
    })
    const saved = await newCourseFile.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/course-file/:id/header
router.patch('/:id/header', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { CourseTitle, Semester, Period, AcademicYear, Batch, Credits, LTP, CIEMarks, SEEMarks, CourseCoordinatorName } = req.body
    const updated = await CourseFile.findByIdAndUpdate(
      req.params.id,
      { CourseTitle, Semester, Period, AcademicYear, Batch, Credits, LTP, CIEMarks, SEEMarks, CourseCoordinatorName },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Course file not found' })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/course-file/:id/particular/:slNo
router.patch('/:id/particular/:slNo', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { Status, Details } = req.body
    const cf = await CourseFile.findById(req.params.id)
    if (!cf) return res.status(404).json({ error: 'Course file not found' })

    const particular = cf.Particulars.find((p) => p.SlNo === Number(req.params.slNo))
    if (!particular) return res.status(404).json({ error: 'Particular not found' })

    if (Status !== undefined) particular.Status = Status
    if (Details !== undefined) particular.Details = Details
    particular.UpdatedAt = new Date()

    await cf.save()
    res.json(cf)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/course-file/:id/pdf - full checklist / cover-page printout
router.get('/:id/pdf', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const cf = await CourseFile.findById(req.params.id)
    if (!cf) return res.status(404).json({ error: 'Course file not found' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="CourseFile_${cf.CourseCode}.pdf"`)
    const doc = generateCourseFileIndexPdf(cf)
    doc.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/course-file/:id/particular/:slNo/pdf - single-particular printout
router.get('/:id/particular/:slNo/pdf', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const cf = await CourseFile.findById(req.params.id)
    if (!cf) return res.status(404).json({ error: 'Course file not found' })
    const particular = cf.Particulars.find((p) => p.SlNo === Number(req.params.slNo))
    if (!particular) return res.status(404).json({ error: 'Particular not found' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${cf.CourseCode}_${particular.SlNo}_${particular.Name.slice(0, 20)}.pdf"`)
    const doc = generateParticularPdf(cf, particular)
    doc.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/course-file/:id - fetch a course file directly by its Mongo _id
// (used by the standalone particular page, which only has the id + slNo from the URL)
router.get('/:id', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const cf = await CourseFile.findById(req.params.id)
    if (!cf) return res.status(404).json({ error: 'Course file not found' })
    res.json(cf)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// GET /api/course-file/:id/syllabus-pdf - full syllabus document:
// institutional header + admin details + prerequisites + the actual uploaded syllabus, merged into one PDF
router.get('/:id/syllabus-pdf', verifyToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const cf = await CourseFile.findById(req.params.id)
    if (!cf) return res.status(404).json({ error: 'Course file not found' })

    const course = await Course.findOne({ CourseCode: cf.CourseCode })
    if (!course) return res.status(404).json({ error: 'Course not found' })
    if (!course.SyllabusPDF || !course.SyllabusPDF.data) {
      return res.status(404).json({ error: 'No syllabus uploaded for this course yet. Upload one in Course List first.' })
    }

    const mappings = await CourseFacultyMap.find({ CourseCode: cf.CourseCode })
    const facultyIds = [...new Set(mappings.map((m) => m.FacultyID))]
    const facultyRecords = await Faculty.find({ FacultyID: { $in: facultyIds } }).select('FacultyID Name Designation Email')
    const facultyRows = facultyRecords.map((f) => ({ Name: f.Name, Designation: f.Designation, Email: f.Email }))

    const coverBytes = await generateSyllabusCoverPdf({
      departmentName: 'DEPARTMENT OF INFORMATION SCIENCE & ENGINEERING',
      course,
      facultyRows,
    })

    const mergedPdf = await PDFLibDocument.create()
    const coverDoc = await PDFLibDocument.load(coverBytes)
    const uploadedDoc = await PDFLibDocument.load(course.SyllabusPDF.data)

    const coverPages = await mergedPdf.copyPages(coverDoc, coverDoc.getPageIndices())
    coverPages.forEach((p) => mergedPdf.addPage(p))
    const uploadedPages = await mergedPdf.copyPages(uploadedDoc, uploadedDoc.getPageIndices())
    uploadedPages.forEach((p) => mergedPdf.addPage(p))

    const finalBytes = await mergedPdf.save()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="Syllabus_${cf.CourseCode}.pdf"`)
    res.send(Buffer.from(finalBytes))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router