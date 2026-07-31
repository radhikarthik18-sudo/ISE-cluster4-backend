const mongoose = require('mongoose')

// One subject/activity allocated within a slot. CourseCode present = a real
// course; ManualText present = a free-text entry (event, activity, etc.).
const timeTableItemSchema = new mongoose.Schema(
  {
    CourseCode: String,
    CourseTitle: String,
    FacultyID: String,
    FacultyName: String,
    ManualText: String,
  },
  { _id: false }
)

// A Day+Period cell can now hold multiple items (e.g. parallel lab batches,
// elective options running at the same time).
const timeTableSlotSchema = new mongoose.Schema({
  Day: String,
  PeriodIndex: Number,
  Items: [timeTableItemSchema],
})

const timeTableSchema = new mongoose.Schema({
  Section: { type: String, required: true, unique: true },
  Slots: [timeTableSlotSchema],
})

module.exports = mongoose.model('TimeTable', timeTableSchema)