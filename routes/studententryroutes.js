const express = require('express')
const router = express.Router()
const StudentEntry = require('../models/studententrymodels')
const multer = require('multer')
const xlsx = require('xlsx')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

const upload = multer({ storage: multer.memoryStorage() })

router.post('/', verifyToken, requireRole('Admin', 'StudentCoordinator'), async (req, res) => {
  try {
    const newStudent = new StudentEntry(req.body)
    const savedStudent = await newStudent.save()
    res.status(201).json(savedStudent)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `USN ${req.body.USN} already exists` })
    }
    res.status(400).json({ error: err.message })
  }
})

// GET /api/students/Years - list of years that have data
router.get('/Years', verifyToken, requireRole('Admin', 'HOD', 'StudentCoordinator'), async (req, res) => {
  try {
    const years = await StudentEntry.distinct('Year')
    res.json(years)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/students?Year=2025 - list of usn+name for a given year
router.get('/', verifyToken, requireRole('Admin', 'HOD', 'StudentCoordinator'), async (req, res) => {
  try {
    const { Year } = req.query
    const students = await StudentEntry.find({ Year }).select('USN StudentName')
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// GET /api/students/allocation-summary - count of students per Semester+Section
router.get('/allocation-summary', verifyToken, requireRole('Admin', 'HOD', 'StudentCoordinator'), async (req, res) => {
  try {
    const summary = await StudentEntry.aggregate([
      { $match: { Semester: { $ne: '' }, Section: { $ne: '' } } },
      { $group: { _id: { Semester: '$Semester', Section: '$Section' }, count: { $sum: 1 } } },
      { $sort: { '_id.Semester': 1, '_id.Section': 1 } },
    ])
    res.json(summary)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/students/:id/unallocate - remove Semester/Section from one student
router.patch('/:id/unallocate', verifyToken, requireRole('Admin', 'StudentCoordinator'), async (req, res) => {
  try {
    const updated = await StudentEntry.findByIdAndUpdate(
      req.params.id,
      { Semester: '', Section: '' },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Student not found' })
    res.json({ message: 'Student removed from allocation' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// GET /api/students/:id - full details of one student
router.get('/:id', verifyToken, requireRole('Admin', 'HOD', 'StudentCoordinator'), async (req, res) => {
  try {
    const student = await StudentEntry.findById(req.params.id)
    if (!student) return res.status(404).json({ error: 'Student not found' })
    res.json(student)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/students/upload - bulk upload from Excel
router.post('/upload', verifyToken, requireRole('Admin', 'StudentCoordinator'), upload.single('file'), async (req, res) => {
  try {
    const { Year } = req.body

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet)

    const students = rows.map((row) => ({
      Year,
      USN: row['USN'],
      StudentName: row['Student Name'],
      StudentEmail: row['Student Email Address'],
      StudentPhone: row['Student Ph. no.'],
      FatherName: row["Father's Name"],
      FatherOccupation: row["Father's Occupation"],
      FatherCompany: row["Father's Company Name"],
      FatherDesignation: row["Father's Designation and Role"],
      FatherEmail: row["Father's Email ID"],
      FatherPhone: row["Father's Phone No"],
      MotherName: row["Mother's Name"],
      MotherOccupation: row["Mother's Occupation"],
      MotherCompany: row["Mother's Company"],
      MotherDesignation: row["Mother's Designation and Role 2"],
      MotherEmail: row["Mother's Email ID"],
      MotherPhone: row["Mother's Phone Number"],
    }))

    const saved = await StudentEntry.insertMany(students, { ordered: false })
    res.status(201).json({ count: saved.length })
  } catch (err) {
    if (err.code === 11000 || err.writeErrors) {
      const insertedCount = err.result?.result?.nInserted || err.insertedDocs?.length || 0
      const duplicateCount = err.writeErrors?.length || 0
      return res.status(207).json({
        message: `${insertedCount} students uploaded, ${duplicateCount} skipped (duplicate USN)`,
      })
    }
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/students/allocate - bulk assign Semester + Section to selected students
router.patch('/allocate', verifyToken, requireRole('Admin', 'StudentCoordinator'), async (req, res) => {
  try {
    const { studentIds, Semester, Section } = req.body

    let updatedCount = 0
    for (const id of studentIds) {
      const updated = await StudentEntry.findByIdAndUpdate(
        id,
        { Semester, Section },
        { new: true }
      )
      if (updated) updatedCount++
    }

    res.json({ message: `${updatedCount} students allocated` })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/students/by-semester/list?Semester=3 - open to any logged-in user
// (Faculty needs this in the background for Attendance / Course-Student Map)
router.get('/by-semester/list', verifyToken, async (req, res) => {
  try {
    const { Semester } = req.query
    const students = await StudentEntry.find({ Semester }).select('USN StudentName Section')
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



module.exports = router