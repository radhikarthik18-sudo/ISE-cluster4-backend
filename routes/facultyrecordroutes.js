const express = require('express')
const router = express.Router()
const Faculty = require('../models/facultyrecordmodels')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const xlsx = require('xlsx')
const jwt = require('jsonwebtoken')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')
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

router.get('/', verifyToken, async (req, res) => {
  try {
    const { status } = req.query
    const filter = status === 'inactive' ? { IsActive: false }
      : status === 'all' ? {}
      : { IsActive: { $ne: false } }
    const faculty = await Faculty.find(filter).select('FacultyID Name IsActive')
    res.json(faculty)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/faculty/:facultyId - full details of one faculty member
router.get('/:facultyId', async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ FacultyID: req.params.facultyId })
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' })
    res.json(faculty)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/faculty/:facultyId - update faculty details (not password)
router.put('/:facultyId', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { Password, ...updateData } = req.body
    const updated = await Faculty.findOneAndUpdate(
      { FacultyID: req.params.facultyId },
      updateData,
      { new: true, runValidators: true }
    )
    if (!updated) return res.status(404).json({ error: 'Faculty not found' })
    res.json(updated)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Faculty ID ${req.body.FacultyID} already exists` })
    }
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/faculty/:facultyId/deactivate
router.patch('/:facultyId/deactivate', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { remarks } = req.body

    const updated = await Faculty.findOneAndUpdate(
      { FacultyID: req.params.facultyId },
      { IsActive: false, DeactivationRemarks: remarks, DeactivatedAt: new Date(), CreditsAllotted: 0 },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Faculty not found' })

    // Cascade: remove all course allocations tied to this faculty
    const CourseFacultyMap = require('../models/courseFacultyMapModel')
    await CourseFacultyMap.deleteMany({ FacultyID: req.params.facultyId })

    res.json({ message: 'Faculty deactivated', faculty: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/faculty/:facultyId/reactivate
router.patch('/:facultyId/reactivate', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const updated = await Faculty.findOneAndUpdate(
      { FacultyID: req.params.facultyId },
      { IsActive: true, DeactivationRemarks: '', DeactivatedAt: null },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Faculty not found' })
    res.json({ message: 'Faculty reactivated', faculty: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/faculty/:facultyId/reset-password
router.patch('/:facultyId/reset-password', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { newPassword } = req.body
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(newPassword, salt)

    const updated = await Faculty.findOneAndUpdate(
      { FacultyID: req.params.facultyId },
      { Password: hashed },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Faculty not found' })
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/faculty/:facultyId/roles
router.patch('/:facultyId/roles', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { Roles } = req.body
    const updated = await Faculty.findOneAndUpdate(
      { FacultyID: req.params.facultyId },
      { Roles },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Faculty not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// POST /api/faculty/upload - bulk upload from Excel
router.post('/upload', verifyToken, requireRole('Admin'), upload.single('file'), async (req, res) => {
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

// POST /api/faculty/login
router.post('/login', async (req, res) => {
  try {
    const { FacultyID, Password } = req.body

    const faculty = await Faculty.findOne({ FacultyID })
    if (!faculty) return res.status(401).json({ error: 'Invalid Faculty ID or Password' })

    const isMatch = await bcrypt.compare(Password, faculty.Password)
    if (!isMatch) return res.status(401).json({ error: 'Invalid Faculty ID or Password' })

    const token = jwt.sign(
      { FacultyID: faculty.FacultyID, Name: faculty.Name, Roles: faculty.Roles },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({ token, FacultyID: faculty.FacultyID, Name: faculty.Name, Roles: faculty.Roles })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router