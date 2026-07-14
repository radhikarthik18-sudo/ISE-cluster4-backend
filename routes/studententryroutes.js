const express = require('express')
const router=express.Router()
const StudentEntry=require('../models/studententrymodels')
const multer = require('multer')
const xlsx = require('xlsx')

const upload = multer({ storage: multer.memoryStorage() })

router.post('/', async (req, res) => {
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


// GET /api/students/years - list of years that have data
router.get('/Years', async (req, res) => {
  try {
    const years = await StudentEntry.distinct('Year')
    res.json(years)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/students?year=2025 - list of usn+name for a given year
router.get('/', async (req, res) => {
  try {
    const { Year } = req.query
    const students = await StudentEntry.find({ Year }).select('USN StudentName')
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/students/:id - full details of one student
router.get('/:id', async (req, res) => {
  try {
    const student = await StudentEntry.findById(req.params.id)
    if (!student) return res.status(404).json({ error: 'Student not found' })
    res.json(student)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/students/upload - bulk upload from Excel
router.post('/upload', upload.single('file'), async (req, res) => {
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
    // insertMany with ordered:false still throws, but includes partial results
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
router.patch('/allocate', async (req, res) => {
  try {
    console.log('Allocate request body:', req.body)   // ← add this

    const { studentIds, Semester, Section } = req.body

    let updatedCount = 0
    for (const id of studentIds) {
      const updated = await StudentEntry.findByIdAndUpdate(
        id,
        { Semester, Section },
        { new: true }
      )
      console.log('Updated one:', updated ? updated.USN : 'NOT FOUND')   // ← add this too
      if (updated) updatedCount++
    }

    res.json({ message: `${updatedCount} students allocated` })
  } catch (err) {
    console.log('Allocate error:', err.message)   // ← add this
    res.status(400).json({ error: err.message })
  }
})
module.exports = router