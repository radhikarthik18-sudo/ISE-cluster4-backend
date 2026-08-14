const express = require('express')
const router = express.Router()
const IAQuestionPaper = require('../models/iaQuestionPaperModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

const CONFIG_ROLES = ['Admin', 'HOD', 'ChiefCourseCoordinator']

router.get('/', verifyToken, async (req, res) => {
  try {
    const { CourseCode, ComponentKey } = req.query
    const qp = await IAQuestionPaper.findOne({ CourseCode, ComponentKey })
    res.json(qp || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', verifyToken, requireRole(...CONFIG_ROLES), async (req, res) => {
  try {
    const { CourseCode, ComponentKey, MainQuestions, TotalMarks } = req.body
    if (!CourseCode || !ComponentKey || !MainQuestions || !MainQuestions.length) {
      return res.status(400).json({ error: 'CourseCode, ComponentKey, and at least one main question are required' })
    }
    const updated = await IAQuestionPaper.findOneAndUpdate(
      { CourseCode, ComponentKey },
      { CourseCode, ComponentKey, MainQuestions, TotalMarks },
      { new: true, upsert: true }
    )
    res.status(201).json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router