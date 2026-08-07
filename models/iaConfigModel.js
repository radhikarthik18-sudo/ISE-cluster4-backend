const mongoose = require('mongoose')

const componentSchema = new mongoose.Schema({
  Type: String,          // 'Theory' or 'Practical'
  Name: String,           // 'CIE-IA Tests', 'CIE-CCA', etc.
  Count: Number,          // how many instances (e.g., 3 IA tests)
  ActualMarks: Number,    // marks entered raw (e.g., 40)
  ReducedMarks: Number,   // marks it contributes after scaling (e.g., 20)
})

const iaConfigSchema = new mongoose.Schema({
  CourseCategory: { type: String, required: true, unique: true },
  Components: [componentSchema],
})

module.exports = mongoose.model('IAConfig', iaConfigSchema)