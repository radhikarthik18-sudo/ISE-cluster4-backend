const express = require('express')
const router = express.Router()
const multer = require('multer')
const Course = require('../models/courseModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

// Holds the uploaded PDF in memory just long enough to write it into MongoDB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap — raise if syllabi run larger
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed for the syllabus'))
    }
    cb(null, true)
  },
})

router.post('/', upload.single('SyllabusPDF'), async (req, res) => {
   console.log('BODY:', req.body)
  console.log('FILE:', req.file)
  try {
    const courseData = { ...req.body }
    if (req.file) {
      courseData.SyllabusPDF = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      }
    }
    const newCourse = new Course(courseData)
    const saved = await newCourse.save()
    res.status(201).json(saved)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Course Code ${req.body.CourseCode} already exists` })
    }
    res.status(400).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().select('CourseCode CourseTitle')
    res.json(courses)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    // Exclude the PDF binary from the general fetch — it's large and most
    // callers (forms, lists) don't need it. Use /:id/syllabus for the file.
    const course = await Course.findById(req.params.id).select('-SyllabusPDF.data')
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json(course)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/courses/:id/syllabus — view/download the syllabus PDF.
// Allowed for Admin/HOD/AcademicCoordinator, or any faculty allocated to this course.
router.get('/:id/syllabus', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })
    if (!course.SyllabusPDF || !course.SyllabusPDF.data) {
      return res.status(404).json({ error: 'No syllabus uploaded for this course' })
    }

    const privilegedRoles = ['Admin', 'HOD', 'AcademicCoordinator']
    const userRoles = req.user?.Roles || []
    const isPrivileged = privilegedRoles.some((r) => userRoles.includes(r))

    if (!isPrivileged) {
      const CourseFacultyMap = require('../models/courseFacultyMapModel')
      const isAllocated = await CourseFacultyMap.exists({
        CourseCode: course.CourseCode,
        FacultyID: req.user.FacultyID,
      })
      if (!isAllocated) {
        return res.status(403).json({ error: 'You are not allocated to this course' })
      }
    }

    res.set({
      'Content-Type': course.SyllabusPDF.contentType || 'application/pdf',
      'Content-Disposition': `inline; filename="${course.SyllabusPDF.filename || 'syllabus.pdf'}"`,
    })
    res.send(course.SyllabusPDF.data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', verifyToken, requireRole('Admin', 'HOD', 'AcademicCoordinator'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })

    const CourseFacultyMap = require('../models/courseFacultyMapModel')
    const LessonPlan = require('../models/lessonPlanModel')
    const COAllocation = require('../models/coAllocationModel')
    const COPOMapping = require('../models/copoMappingModel')
    const Faculty = require('../models/facultyrecordmodels')

    const relatedMappings = await CourseFacultyMap.find({ CourseCode: course.CourseCode })
    for (const mapping of relatedMappings) {
      await Faculty.findOneAndUpdate(
        { FacultyID: mapping.FacultyID },
        { $inc: { CreditsAllotted: -mapping.Credits } }
      )
    }

    await CourseFacultyMap.deleteMany({ CourseCode: course.CourseCode })
    await LessonPlan.deleteMany({ CourseCode: course.CourseCode })
    await COAllocation.deleteMany({ CourseCode: course.CourseCode })
    await COPOMapping.deleteMany({ CourseCode: course.CourseCode })

    await Course.findByIdAndDelete(req.params.id)

    res.json({ message: 'Course and all related data deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router