const express = require('express')
const router = express.Router()
const Course = require('../models/courseModel')

router.post('/', async (req, res) => {
  try {
    const newCourse = new Course(req.body)
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
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json(course)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const { verifyToken, requireRole } = require('../middleware/authMiddleware')

// DELETE /api/courses/:id
router.delete('/:id', verifyToken, requireRole('Admin', 'HOD', 'AcademicCoordinator'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })

    const CourseFacultyMap = require('../models/courseFacultyMapModel')
    const LessonPlan = require('../models/lessonPlanModel')
    const COAllocation = require('../models/coAllocationModel')
    const COPOMapping = require('../models/copoMappingModel')
    const Faculty = require('../models/facultyrecordmodels')

    // Reverse credits for every faculty currently allocated to this course
    const relatedMappings = await CourseFacultyMap.find({ CourseCode: course.CourseCode })
    for (const mapping of relatedMappings) {
      await Faculty.findOneAndUpdate(
        { FacultyID: mapping.FacultyID },
        { $inc: { CreditsAllotted: -mapping.Credits } }
      )
    }

    // Cascade delete everything tied to this course
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