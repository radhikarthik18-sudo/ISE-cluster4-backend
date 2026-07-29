const express = require('express')
const router = express.Router()
const COAllocation = require('../models/coAllocationModel')
const { verifyToken } = require('../middleware/authMiddleware')

router.post('/', verifyToken, async (req, res) => {
  try {
    const { CourseCode, CourseTitle, COs } = req.body
    const updated = await COAllocation.findOneAndUpdate(
      { CourseCode },
      { CourseCode, CourseTitle, COs },
      { new: true, upsert: true }
    )
    res.status(201).json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/by-course/:courseCode', verifyToken, async (req, res) => {
  try {
    const record = await COAllocation.findOne({ CourseCode: req.params.courseCode })
    res.json(record || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router