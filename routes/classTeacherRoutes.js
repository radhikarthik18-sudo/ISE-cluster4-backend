const express = require('express')
const router = express.Router()
const ClassTeacher = require('../models/classTeacherModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

router.post('/', verifyToken, requireRole('Admin', 'HOD', 'StudentCoordinator'), async (req, res) => {
  try {
    const { Semester, Section, FacultyID, FacultyName } = req.body
    const updated = await ClassTeacher.findOneAndUpdate(
      { Semester, Section },
      { Semester, Section, FacultyID, FacultyName },
      { new: true, upsert: true }
    )
    res.status(201).json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/by-section', verifyToken, async (req, res) => {
  try {
    const { Semester, Section } = req.query
    const ct = await ClassTeacher.findOne({ Semester, Section })
    res.json(ct || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', verifyToken, requireRole('Admin', 'HOD', 'StudentCoordinator'), async (req, res) => {
  try {
    const all = await ClassTeacher.find()
    res.json(all)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router