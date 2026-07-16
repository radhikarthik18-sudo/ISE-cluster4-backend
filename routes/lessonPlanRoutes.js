const express = require('express')
const router = express.Router()
const LessonPlan = require('../models/lessonPlanModel')

router.post('/', async (req, res) => {
  try {
    const newPlan = new LessonPlan(req.body)
    const saved = await newPlan.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const updated = await LessonPlan.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const plans = await LessonPlan.find().select('CourseCode CourseTitle')
    res.json(plans)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const plan = await LessonPlan.findById(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    res.json(plan)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET by course code - so Attendance can later look up topics for a given course
router.get('/by-course/:courseCode', async (req, res) => {
  try {
    const plan = await LessonPlan.findOne({ CourseCode: req.params.courseCode })
    res.json(plan || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router