const mongoose = require('mongoose')

const coSchema = new mongoose.Schema({
  Label: String,       // e.g., 'CO1'
  Description: String,
})

const coAllocationSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true, unique: true },
  CourseTitle: String,
  COs: [coSchema],
})

module.exports = mongoose.model('COAllocation', coAllocationSchema)