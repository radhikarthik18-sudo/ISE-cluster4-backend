const mongoose = require('mongoose')

const classTeacherSchema = new mongoose.Schema({
  Semester: { type: String, required: true },
  Section: { type: String, required: true },
  FacultyID: { type: String, required: true },
  FacultyName: String,
})

classTeacherSchema.index({ Semester: 1, Section: 1 }, { unique: true })

module.exports = mongoose.model('ClassTeacher', classTeacherSchema)