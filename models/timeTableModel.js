const mongoose = require('mongoose')

const timeTableSlotSchema = new mongoose.Schema({
  Day: String,
  PeriodIndex: Number,
  CourseCode: String,
  CourseTitle: String,
  FacultyID: String,
  FacultyName: String,
  ManualText: String,
})

const timeTableSchema = new mongoose.Schema({
  Section: { type: String, required: true, unique: true },
  Slots: [timeTableSlotSchema],
})

module.exports = mongoose.model('TimeTable', timeTableSchema)