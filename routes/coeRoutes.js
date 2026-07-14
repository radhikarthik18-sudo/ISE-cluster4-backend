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
      .select('Title Semester AcademicYear Term createdAt')
      .sort({ _id: -1 }) // newest first
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
module.exports = router
