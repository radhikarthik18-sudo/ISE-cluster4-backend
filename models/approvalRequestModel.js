const mongoose = require('mongoose')

// Generic approval queue — DocType/DocId let this same table support future
// document types beyond COE (e.g. syllabus, proctor report) without a redesign.
const approvalRequestSchema = new mongoose.Schema({
  DocType: { type: String, required: true }, // 'COE' for now
  DocId: { type: mongoose.Schema.Types.ObjectId, required: true },
  Title: { type: String, required: true },
  Status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
  SubmittedBy: String,
  SubmittedAt: { type: Date, default: Date.now },
  ApprovedBy: String,
  ApprovedAt: Date,
})

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema)