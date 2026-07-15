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
  WorkingDays: Number, // now auto-computed, stored for record-keeping
})

const eventSchema = new mongoose.Schema(
  {
    Text: String,
    Color: String,
    Date: String, // ISO "YYYY-MM-DD"
    IsHoliday: { type: Boolean, default: false }, // true = reduces Working Days count
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
})

const COE = mongoose.model('COE', coeSchema)
module.exports = COE