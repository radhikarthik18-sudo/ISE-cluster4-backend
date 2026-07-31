const express = require('express')
const router = express.Router()
const TimeTable = require('../models/timeTableModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

// POST /api/timetable - save/update a section's full timetable
router.post('/', verifyToken, requireRole('Admin', 'HOD', 'AcademicCoordinator'), async (req, res) => {
  try {
    const { Section, Slots } = req.body
    const updated = await TimeTable.findOneAndUpdate(
      { Section },
      { Section, Slots },
      { new: true, upsert: true }
    )
    res.status(201).json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/timetable/by-section/:section
router.get('/by-section/:section', verifyToken, async (req, res) => {
  try {
    const tt = await TimeTable.findOne({ Section: req.params.section })
    res.json(tt || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/timetable/by-faculty/:facultyId - aggregate this faculty's slots across all sections
router.get('/by-faculty/:facultyId', verifyToken, async (req, res) => {
  try {
    const allTimeTables = await TimeTable.find({ 'Slots.FacultyID': req.params.facultyId })
    const facultySlots = []
    allTimeTables.forEach((tt) => {
      tt.Slots.forEach((slot) => {
        if (slot.FacultyID === req.params.facultyId) {
          facultySlots.push({ ...slot.toObject(), Section: tt.Section })
        }
      })
    })
    res.json(facultySlots)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router