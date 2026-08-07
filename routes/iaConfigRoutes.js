const express = require('express')
const router = express.Router()
const IAConfig = require('../models/iaConfigModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

router.post('/', verifyToken, requireRole('Admin', 'HOD', 'AcademicCoordinator'), async (req, res) => {
  try {
    const { CourseCategory, Components } = req.body
    const updated = await IAConfig.findOneAndUpdate(
      { CourseCategory },
      { CourseCategory, Components },
      { new: true, upsert: true }
    )
    res.status(201).json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/', verifyToken, async (req, res) => {
  try {
    const all = await IAConfig.find()
    res.json(all)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/by-category/:category', verifyToken, async (req, res) => {
  try {
    const config = await IAConfig.findOne({ CourseCategory: req.params.category })
    res.json(config || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router