const express = require('express')
const router = express.Router()
const Attendance = require('../models/attendanceModel')

// Save one attendance session
router.post('/', async (req, res) => {
  try {
    const newRecord = new Attendance(req.body)
    const saved = await newRecord.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// All attendance records for a Course+Section (used to compute running %)
router.get('/', async (req, res) => {
  try {
    const { CourseCode, Section } = req.query
    const records = await Attendance.find({ CourseCode, Section })
    res.json(records)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router