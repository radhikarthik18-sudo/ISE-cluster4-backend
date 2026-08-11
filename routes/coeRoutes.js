const express = require('express')
const router = express.Router()
const multer = require('multer')
const COE = require('../models/coeModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'))
    }
    cb(null, true)
  },
})

router.post('/', async (req, res) => {
  try {
    const newCOE = new COE(req.body)
    const saved = await newCOE.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const docs = await COE.find()
      .select('Title Semester AcademicYear Term')
      .sort({ _id: -1 })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    // Exclude the PDF binary here — it's large and this route is used for
    // the calendar's regular data (weeks, events); the signed copy has its
    // own dedicated route below.
    const doc = await COE.findById(req.params.id).select('-SignedPdf.data')
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const updated = await COE.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST /api/coe/:id/signed-pdf - upload/replace the signed copy
router.post(
  '/:id/signed-pdf',
  verifyToken,
  requireRole('Admin', 'HOD', 'AcademicCoordinator'),
  upload.single('SignedPdf'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
      const doc = await COE.findById(req.params.id)
      if (!doc) return res.status(404).json({ error: 'Not found' })

      doc.SignedPdf = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      }
      await doc.save()
      res.json({ message: 'Signed copy uploaded' })
    } catch (err) {
      res.status(400).json({ error: err.message })
    }
  }
)

// GET /api/coe/:id/signed-pdf - view the signed copy
router.get('/:id/signed-pdf', async (req, res) => {
  try {
    const doc = await COE.findById(req.params.id)
    if (!doc || !doc.SignedPdf || !doc.SignedPdf.data) {
      return res.status(404).json({ error: 'No signed copy uploaded for this calendar' })
    }
    res.set({
      'Content-Type': doc.SignedPdf.contentType || 'application/pdf',
      'Content-Disposition': `inline; filename="${doc.SignedPdf.filename || 'signed-coe.pdf'}"`,
    })
    res.send(doc.SignedPdf.data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router