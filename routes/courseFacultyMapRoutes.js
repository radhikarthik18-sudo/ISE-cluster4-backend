const express = require('express')
const router = express.Router()
const CourseFacultyMap = require('../models/courseFacultyMapModel')
const Faculty = require('../models/facultyrecordmodels')

// POST /api/course-faculty-map - allocate a subject to a faculty
router.post('/', async (req, res) => {
  try {
    const { CourseCode, CourseTitle, Section, FacultyID, FacultyName, Credits } = req.body

    const newMap = new CourseFacultyMap({
      CourseCode, CourseTitle, Section, FacultyID, FacultyName, Credits,
    })
    const saved = await newMap.save()

    // Update the faculty's running credit total
    await Faculty.findOneAndUpdate(
      { FacultyID },
      { $inc: { CreditsAllotted: Credits } }
    )

    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/course-faculty-map - list all mappings
router.get('/', async (req, res) => {
  try {
    const maps = await CourseFacultyMap.find()
    res.json(maps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/course-faculty-map/lookup?CourseCode=X&Section=Y
router.get('/lookup', async (req, res) => {
  try {
    const { CourseCode, Section } = req.query
    const existing = await CourseFacultyMap.findOne({ CourseCode, Section })
    res.json(existing || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/course-faculty-map/:id - reassign faculty for an existing mapping
router.put('/:id', async (req, res) => {
  try {
    const { FacultyID, FacultyName } = req.body

    const existing = await CourseFacultyMap.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Mapping not found' })

    // Remove credits from the OLD faculty
    await Faculty.findOneAndUpdate(
      { FacultyID: existing.FacultyID },
      { $inc: { CreditsAllotted: -existing.Credits } }
    )

    // Add credits to the NEW faculty
    await Faculty.findOneAndUpdate(
      { FacultyID },
      { $inc: { CreditsAllotted: existing.Credits } }
    )

    existing.FacultyID = FacultyID
    existing.FacultyName = FacultyName
    const updated = await existing.save()

    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/course-faculty-map/:id
router.delete('/:id', async (req, res) => {
  try {
    const mapping = await CourseFacultyMap.findById(req.params.id)
    if (!mapping) return res.status(404).json({ error: 'Mapping not found' })

    // Reverse the credits from that faculty
    await Faculty.findOneAndUpdate(
      { FacultyID: mapping.FacultyID },
      { $inc: { CreditsAllotted: -mapping.Credits } }
    )

    await CourseFacultyMap.findByIdAndDelete(req.params.id)

    res.json({ message: 'Allocation deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/course-faculty-map/by-faculty/:facultyId
router.get('/by-faculty/:facultyId', async (req, res) => {
  try {
    const maps = await CourseFacultyMap.find({ FacultyID: req.params.facultyId })
    res.json(maps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
module.exports = router