const express = require('express')
const router = express.Router()
const Faculty = require('../models/facultyrecordmodels')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const xlsx = require('xlsx')

const upload = multer({ storage: multer.memoryStorage() })

router.post('/', async (req, res) => {
  try {
    const facultyData = { ...req.body }

    if (facultyData.Password) {
      const salt = await bcrypt.genSalt(10)
      facultyData.Password = await bcrypt.hash(facultyData.Password, salt)
    }
    
    const newFaculty = new Faculty(facultyData)
    const saved = await newFaculty.save()
    res.status(201).json(saved)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Faculty ID ${req.body.FacultyID} already exists` })
    }
    res.status(400).json({ error: err.message })
  }
})


router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find().select('FacultyID Name')
    res.json(faculty)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/faculty/:id - full details of one faculty member
router.get('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' })
    res.json(faculty)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/faculty/:id - update faculty details (not password)
router.put('/:id', async (req, res) => {
  try {
    const { Password, ...updateData } = req.body   // strip out Password if present
    const updated = await Faculty.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
    if (!updated) return res.status(404).json({ error: 'Faculty not found' })
    res.json(updated)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Faculty ID ${req.body.FacultyID} already exists` })
    }
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/faculty/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Faculty.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Faculty not found' })
    res.json({ message: 'Faculty deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(newPassword, salt)

    const updated = await Faculty.findByIdAndUpdate(
      req.params.id,
      { Password: hashed },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Faculty not found' })
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



// POST /api/faculty/upload - bulk upload from Excel
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet)

    const facultyRecords = rows.map((row) => ({
      FacultyID: row['FacultyID'],
      Name: row['Name'],
      Email: row['Email'],
      Phone: row['Phone'],
      DateOfJoining: row['DateOfJoining'],
      Designation: row['Designation'],
      Qualification: row['Qualification'],
      Experience: row['Experience'],
      Specialization: row['Specialization'],
    }))

    const saved = await Faculty.insertMany(facultyRecords, { ordered: false })
    res.status(201).json({ count: saved.length })
  } catch (err) {
    if (err.code === 11000 || err.writeErrors) {
      const insertedCount = err.result?.result?.nInserted || err.insertedDocs?.length || 0
      const duplicateCount = err.writeErrors?.length || 0
      return res.status(207).json({
        message: `${insertedCount} faculty uploaded, ${duplicateCount} skipped (duplicate Faculty ID)`,
      })
    }
    res.status(400).json({ error: err.message })
  }
})

module.exports = router