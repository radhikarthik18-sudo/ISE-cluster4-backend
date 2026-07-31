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

// GET /api/timetable/by-faculty/:facultyId - this faculty's slots across all sections,
// flattened out of each slot's Items array (a slot can hold multiple subjects/faculty).
router.get('/by-faculty/:facultyId', verifyToken, async (req, res) => {
  try {
    const allTimeTables = await TimeTable.find({ 'Slots.Items.FacultyID': req.params.facultyId })
    const facultySlots = []
    allTimeTables.forEach((tt) => {
      tt.Slots.forEach((slot) => {
        slot.Items.forEach((item) => {
          if (item.FacultyID === req.params.facultyId) {
            facultySlots.push({
              Day: slot.Day,
              PeriodIndex: slot.PeriodIndex,
              CourseCode: item.CourseCode,
              CourseTitle: item.CourseTitle,
              Section: tt.Section,
            })
          }
        })
      })
    })
    res.json(facultySlots)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/by-faculty/:facultyId', verifyToken, async (req, res) => {
  try {
    console.log('Looking for FacultyID:', JSON.stringify(req.params.facultyId))
    const allTimeTables = await TimeTable.find({ 'Slots.Items.FacultyID': req.params.facultyId })
    console.log('Matched timetables:', allTimeTables.length)
    const facultySlots = []
    allTimeTables.forEach((tt) => {
      tt.Slots.forEach((slot) => {
        slot.Items.forEach((item) => {
          if (item.FacultyID === req.params.facultyId) {
            facultySlots.push({
              Day: slot.Day,
              PeriodIndex: slot.PeriodIndex,
              CourseCode: item.CourseCode,
              CourseTitle: item.CourseTitle,
              Section: tt.Section,
            })
          }
        })
      })
    })
    console.log('Flattened faculty slots:', facultySlots.length)
    res.json(facultySlots)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
module.exports = router