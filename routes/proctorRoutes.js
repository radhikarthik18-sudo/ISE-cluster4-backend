const express = require('express')
const router = express.Router()
const StudentEntry = require('../models/studententrymodels')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

// GET /api/proctor/summary?Semester=3&Section=12-L
// Students in a group, sorted by USN, with current proctor if any.
router.get('/summary', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const { Semester, Section } = req.query
    const students = await StudentEntry.find({ Semester, Section })
      .select('USN StudentName ProctorFacultyID ProctorFacultyName')
      .sort({ USN: 1 })
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/proctor/assign - assign a set of students (a clicked range or scattered picks) to one faculty
router.patch('/assign', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const { studentIds, FacultyID, FacultyName } = req.body
    if (!studentIds || !studentIds.length || !FacultyID) {
      return res.status(400).json({ error: 'studentIds and FacultyID are required' })
    }
    const result = await StudentEntry.updateMany(
      { _id: { $in: studentIds } },
      { ProctorFacultyID: FacultyID, ProctorFacultyName: FacultyName }
    )
    res.json({ message: `${result.modifiedCount} student(s) assigned to ${FacultyName}` })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/proctor/unassign - clear proctor from selected students
router.patch('/unassign', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const { studentIds } = req.body
    if (!studentIds || !studentIds.length) {
      return res.status(400).json({ error: 'studentIds are required' })
    }
    const result = await StudentEntry.updateMany(
      { _id: { $in: studentIds } },
      { ProctorFacultyID: '', ProctorFacultyName: '' }
    )
    res.json({ message: `${result.modifiedCount} student(s) unassigned` })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/proctor/overview - how many proctees each faculty currently has, across all sections
router.get('/overview', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const overview = await StudentEntry.aggregate([
      { $match: { ProctorFacultyID: { $nin: [null, ''] } } },
      {
        $group: {
          _id: { FacultyID: '$ProctorFacultyID', FacultyName: '$ProctorFacultyName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.FacultyName': 1 } },
    ])
    res.json(overview)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/proctor/by-faculty/:facultyId - this faculty's own proctee list, with contact details
router.get('/by-faculty/:facultyId', verifyToken, async (req, res) => {
  try {
    const students = await StudentEntry.find({ ProctorFacultyID: req.params.facultyId })
      .select('USN StudentName Semester Section StudentEmail StudentPhone')
      .sort({ USN: 1 })
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router