const mongoose = require('mongoose')

const studentMarkSchema = new mongoose.Schema({
  USN: { type: String, required: true },
  StudentName: String,
  Status: { type: String, required: true }, // 'P' or 'A'
})

const attendanceSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true },
  CourseTitle: String,
  Section: { type: String, required: true },
  Date: { type: String, required: true },
  ModuleNumber: String,
  TopicName: String,
  Marks: [studentMarkSchema],
})

const Attendance = mongoose.model('Attendance', attendanceSchema)
module.exports = Attendance