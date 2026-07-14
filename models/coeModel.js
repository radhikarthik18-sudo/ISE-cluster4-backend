const mongoose = require('mongoose')

// A single colored event block. Day is optional:
// - set (e.g. "Sat") when the event was added by clicking a specific date number
// - null/undefined when added as a general week-spanning event
const eventSchema = new mongoose.Schema(
  {
    Text: String,
    Color: String, // hex color, e.g. "#e2555c"
    Day: String, // "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | null
  },
  { _id: false }
)

const weekEntrySchema = new mongoose.Schema({
  Month: String,
  Week: String,
  Sun: String,
  Mon: String,
  Tue: String,
  Wed: String,
  Thu: String,
  Fri: String,
  Sat: String,
  WorkingDays: String,
  Events: [eventSchema],
})

const coeSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Semester: { type: String, required: true },
  AcademicYear: { type: String, required: true },
  Term: { type: String, required: true },
  StartDate: String,
  EndDate: String,
  Vision: String,
  Mission: String,

  // NOTE: Institute name/address/logos are no longer stored per-document —
  // they're now rendered by the shared <InstituteHeader /> component so
  // every document (current and future) stays consistent automatically.

  // Footer signatories, in display order (defaults to 4 to match the sample CoE)
  Signatories: {
    type: [String],
    default: ['COE-Coordinator', 'Controller of Examinations', 'Dean Academics', 'Principal'],
  },

  Entries: [weekEntrySchema],
})

const COE = mongoose.model('COE', coeSchema)
module.exports = COE