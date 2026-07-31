const mongoose = require('mongoose')

const timeTableItemSchema = new mongoose.Schema(
  {
    CourseCode: String,
    CourseTitle: String,
    Initial: String,
    FacultyID: String,
    FacultyName: String,
    ManualText: String,
  },
  { _id: false }
)

const timeTableSlotSchema = new mongoose.Schema({
  Day: String,
  PeriodIndex: Number,
  Items: [timeTableItemSchema],
})

const timeTableSchema = new mongoose.Schema({
  Section: { type: String, required: true, unique: true },
  Slots: [timeTableSlotSchema],

  // Printed-document header metadata, all optional
  ClassSemester: String, // e.g. "VII"
  RoomNumber: String,
  ClassTeacherName: String,
  WEF: String, // "With Effect From" date, stored as plain string
  AcademicYear: String, // e.g. "2026-27"
  Term: String, // "ODD" | "EVEN"
})

module.exports = mongoose.model('TimeTable', timeTableSchema)