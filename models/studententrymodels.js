const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
  Year: {
    type: String,
    required: true,
  },
  USN: {
    type: String,
    required: true,
    unique:true,
  },
  StudentName: {
    type: String,
    required: true,
  },
  StudentEmail: String,
  StudentPhone: String,
  FatherName: String,
  FatherOccupation: String,
  FatherCompany: String,
  FatherDesignation: String,
  FatherEmail: String,
  FatherPhone: String,
  MotherName: String,
  MotherOccupation: String,
  MotherCompany: String,
  MotherDesignation: String,
  MotherEmail: String,
  MotherPhone: String,
  Semester: String,
  Section: String,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
})

const StudentEntry = mongoose.model('StudentEntry', studentSchema)

module.exports = StudentEntry