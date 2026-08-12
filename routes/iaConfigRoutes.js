const express = require('express')
const router = express.Router()
const IAConfig = require('../models/iaConfigModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

const CONFIG_ROLES = ['Admin', 'HOD', 'ChiefCourseCoordinator']

// GET /api/ia-config?CourseCode=X - any logged-in user can view (allocated faculty need this too)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { CourseCode } = req.query
    const config = await IAConfig.findOne({ CourseCode })
    res.json(config || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ia-config - create/update (upsert) a course's IA configuration
router.post('/', verifyToken, requireRole(...CONFIG_ROLES), async (req, res) => {
  try {
    const { CourseCode, CourseCategory, Components, TotalMarks } = req.body
    if (!CourseCode || !Components || !Components.length) {
      return res.status(400).json({ error: 'CourseCode and at least one component are required' })
    }
    const updated = await IAConfig.findOneAndUpdate(
      { CourseCode },
      { CourseCode, CourseCategory, Components, TotalMarks },
      { new: true, upsert: true }
    )
    res.status(201).json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router