const mongoose = require('mongoose')

// A single week-grid row. Year is needed alongside Month + the day-number
// columns to reconstruct real ISO dates for matching against Events.
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
  WorkingDays: String,
})

// Events are now a flat, date-keyed list — decoupled from the week grid,
// so they can be added before weeks are generated, fetched in bulk
// (holidays), or span a date range, and still land on the right cell.
const eventSchema = new mongoose.Schema(
  {
    Text: String,
    Color: String, // hex color
    Date: String, // ISO "YYYY-MM-DD"
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