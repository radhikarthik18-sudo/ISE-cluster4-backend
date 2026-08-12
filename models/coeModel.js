const mongoose = require('mongoose')

const weekEntrySchema = new mongoose.Schema({
  Month: String,
  Year: Number,
  Week: String,
  Sun: String,
  Mon: String,
  Tue: String,
  Wed: String,
  Thu: String,
  Fri: String,
  Sat: String,
  WorkingDays: Number,
})

const eventSchema = new mongoose.Schema(
  {
    Text: String,
    Color: String,
    Date: String,
    IsHoliday: { type: Boolean, default: false },
  },
  { _id: false }
)

const coeSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Semester: { type: String, required: true },
  AcademicYear: { type: String, required: true },
  Term: { type: String, required: true },
  StartDate: String,
  EndDate: String,
  Vision: String,
  Mission: String,

  Signatories: {
    type: [String],
    default: ['COE-Coordinator', 'Controller of Examinations', 'Dean Academics', 'Principal'],
  },

  Entries: [weekEntrySchema],
  Events: [eventSchema],
  SemesterEndExams: String,
  SignedPDF: {
    data: Buffer,
    contentType: String,
    filename: String,
  },

  // 'NotSubmitted' -> Print freely (draft/preview).
  // 'Pending' -> Print disabled while awaiting Academic Coordinator approval.
  // 'Approved' -> Print re-enabled.
  ApprovalStatus: { type: String, enum: ['NotSubmitted', 'Pending', 'Approved'], default: 'NotSubmitted' },
})

const COE = mongoose.model('COE', coeSchema)
module.exports = COE