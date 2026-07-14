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

module.exports = router