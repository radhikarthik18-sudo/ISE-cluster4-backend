const mongoose = require('mongoose')

const courseFacultyMapSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true },
  CourseTitle: { type: String, required: true },
  Section: { type: String, required: true },
  FacultyID: { type: String, required: true },
  FacultyName: { type: String, required: true },
  Credits: { type: Number, required: true },
})

const CourseFacultyMap = mongoose.model('CourseFacultyMap', courseFacultyMapSchema)
module.exports = CourseFacultyMap