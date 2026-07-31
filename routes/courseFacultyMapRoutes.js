const express = require('express')
const router = express.Router()
const CourseFacultyMap = require('../models/courseFacultyMapModel')
const Faculty = require('../models/facultyrecordmodels')

router.post('/', async (req, res) => {
  try {
    const { CourseCode, CourseTitle, Initial, Section, FacultyID, FacultyName, Credits } = req.body

    const newMap = new CourseFacultyMap({
      CourseCode, CourseTitle, Initial, Section, FacultyID, FacultyName, Credits,
    })
    const saved = await newMap.save()

    await Faculty.findOneAndUpdate(
      { FacultyID },
      { $inc: { CreditsAllotted: Credits } }
    )

    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const maps = await CourseFacultyMap.find()
    res.json(maps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/lookup', async (req, res) => {
  try {
    const { CourseCode, Section } = req.query
    const existing = await CourseFacultyMap.findOne({ CourseCode, Section })
    res.json(existing || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { FacultyID, FacultyName } = req.body

    const existing = await CourseFacultyMap.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Mapping not found' })

    await Faculty.findOneAndUpdate(
      { FacultyID: existing.FacultyID },
      { $inc: { CreditsAllotted: -existing.Credits } }
    )

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

router.delete('/:id', async (req, res) => {
  try {
    const mapping = await CourseFacultyMap.findById(req.params.id)
    if (!mapping) return res.status(404).json({ error: 'Mapping not found' })

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

router.get('/by-faculty/:facultyId', async (req, res) => {
  try {
    const maps = await CourseFacultyMap.find({ FacultyID: req.params.facultyId })
    res.json(maps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
module.exports = router