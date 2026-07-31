const express = require('express')
const router = express.Router()
const TimeTable = require('../models/timeTableModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

router.post('/', verifyToken, requireRole('Admin', 'HOD', 'AcademicCoordinator'), async (req, res) => {
  try {
    const { Section, Slots, ClassSemester, RoomNumber, ClassTeacherName, WEF, AcademicYear, Term } = req.body
    const updated = await TimeTable.findOneAndUpdate(
      { Section },
      { Section, Slots, ClassSemester, RoomNumber, ClassTeacherName, WEF, AcademicYear, Term },
      { new: true, upsert: true }
    )
    res.status(201).json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/by-section/:section', verifyToken, async (req, res) => {
  try {
    const tt = await TimeTable.findOne({ Section: req.params.section })
    res.json(tt || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

module.exports = router