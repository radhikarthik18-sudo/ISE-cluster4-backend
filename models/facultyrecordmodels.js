const mongoose = require('mongoose')

const facultySchema = new mongoose.Schema({
  FacultyID: {
    type: String,
    required: true,
    unique: true,
  },
  Name: {
    type: String,
    required: true,
  },
  Email: String,
  Phone: String,
  DateOfJoining: {
    type: Date,
  },
  Designation: String,
  Qualification: String,
  Experience: String,
  Specialization: String,
  Password: {
    type: String,
  },
  CreditsAllotted: {
    type: Number,
    default: 0,
  },
  Roles: {
    type: [String],
    default: ['Faculty'],
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
})

const Faculty = mongoose.model('Faculty', facultySchema)

module.exports = Faculty