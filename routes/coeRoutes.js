const express = require('express')
const router = express.Router()
const COE = require('../models/coeModel')

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
    const doc = await COE.findById(req.params.id)
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

const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

// POST /api/courses/:id/syllabus - upload/replace syllabus PDF
router.post('/:id/syllabus', verifyToken, requireRole('Admin', 'HOD', 'AcademicCoordinator'), upload.single('file'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })

    course.SyllabusPDF = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname,
    }
    await course.save()

    res.json({ message: 'Syllabus uploaded' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/courses/:id/syllabus - view/download syllabus PDF
router.get('/:id/syllabus', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course || !course.SyllabusPDF || !course.SyllabusPDF.data) {
      return res.status(404).json({ error: 'No syllabus uploaded for this course' })
    }
    res.set('Content-Type', course.SyllabusPDF.contentType)
    res.set('Content-Disposition', `inline; filename="${course.SyllabusPDF.filename}"`)
    res.send(course.SyllabusPDF.data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
module.exports = router