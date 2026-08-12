const express = require('express')
const router = express.Router()
const ApprovalRequest = require('../models/approvalRequestModel')
const COE = require('../models/coeModel')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

const APPROVAL_ROLES = ['Admin', 'HOD', 'AcademicCoordinator']

// GET /api/approval - the approval inbox table
router.get('/', verifyToken, requireRole(...APPROVAL_ROLES), async (req, res) => {
  try {
    const requests = await ApprovalRequest.find().sort({ SubmittedAt: -1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/approval/coe/:id/submit - COE coordinator submits a calendar for approval
router.post('/coe/:id/submit', verifyToken, requireRole(...APPROVAL_ROLES), async (req, res) => {
  try {
    const coe = await COE.findById(req.params.id)
    if (!coe) return res.status(404).json({ error: 'Calendar not found' })

    coe.ApprovalStatus = 'Pending'
    await coe.save()

    const existingPending = await ApprovalRequest.findOne({ DocType: 'COE', DocId: coe._id, Status: 'Pending' })
    if (existingPending) return res.json(existingPending)

    const request = new ApprovalRequest({
      DocType: 'COE',
      DocId: coe._id,
      Title: coe.Title || `Calendar of Events (${coe.Semester}, ${coe.AcademicYear} ${coe.Term})`,
      SubmittedBy: req.user.FacultyID,
    })
    const saved = await request.save()
    res.status(201).json(saved)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/approval/:id/approve
router.patch('/:id/approve', verifyToken, requireRole(...APPROVAL_ROLES), async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ error: 'Approval request not found' })

    request.Status = 'Approved'
    request.ApprovedBy = req.user.FacultyID
    request.ApprovedAt = new Date()
    await request.save()

    if (request.DocType === 'COE') {
      await COE.findByIdAndUpdate(request.DocId, { ApprovalStatus: 'Approved' })
    }

    res.json(request)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router