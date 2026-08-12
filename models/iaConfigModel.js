const mongoose = require('mongoose')

const componentSchema = new mongoose.Schema(
  {
    Key: { type: String, required: true }, // slug used as the tab id, e.g. "ia1"
    Label: { type: String, required: true }, // display name, e.g. "IA1"
    MaxMarks: { type: Number, required: true },
  },
  { _id: false }
)

const iaConfigSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true, unique: true },
  CourseCategory: String,
  Components: [componentSchema],
  TotalMarks: Number,
})

module.exports = mongoose.model('IAConfig', iaConfigSchema)