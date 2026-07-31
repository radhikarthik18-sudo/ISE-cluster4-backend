const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
  Semester: { type: String, required: true },
  CourseCategory: { type: String, required: true },
  CourseCode: { type: String, required: true, unique: true },
  CourseTitle: { type: String, required: true },
  Initial: String, // short display code for compact timetable views, e.g. "INS", "PC"
  L: { type: String, required: true },
  T: { type: String, required: true },
  P: { type: String, required: true },
  S: String,
  Credits: { type: String, required: true },
  SyllabusPDF: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
})

const Course = mongoose.model('Course', courseSchema)
module.exports = Course