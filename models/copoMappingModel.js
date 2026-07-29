const mongoose = require('mongoose')

const outcomeSchema = new mongoose.Schema({
  Label: String,   // 'PO1'...'PO12' or 'PSO1'...'PSO3'
  Text: String,
})

const mappingCellSchema = new mongoose.Schema({
  CO: String,          // 'CO1'
  Outcome: String,      // 'PO1' or 'PSO2'
  Level: String,        // '1', '2', '3', or ''
})

const copoMappingSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true, unique: true },
  CourseTitle: String,
  POs: [outcomeSchema],
  PSOs: [outcomeSchema],
  Mapping: [mappingCellSchema],
})

module.exports = mongoose.model('COPOMapping', copoMappingSchema)