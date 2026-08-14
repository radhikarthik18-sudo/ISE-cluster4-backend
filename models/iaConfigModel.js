const mongoose = require('mongoose')

const componentSchema = new mongoose.Schema(
  {
    Key: { type: String, required: true }, // slug used as the tab id, e.g. "ia1"
    Label: { type: String, required: true }, // display name, e.g. "IA1"
    MaxMarks: { type: Number, required: true },
    Type: { type: String, enum: ['IA', 'CCA', 'Practical', 'Practical Test', 'Other'], default: 'Other' },
  },
  { _id: false }
)

const iaConfigSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true, unique: true },
  CourseCategory: String,
  Components: [componentSchema],

  // Best-2-of-IA sum: null/0 = keep the raw best-2 sum as-is; otherwise scale down to this value.
  IAScaleTo: { type: Number, default: null },
  // Sum of all CCA components: null/0 = keep the raw sum as-is; otherwise scale down to this value.
  CCAScaleTo: { type: Number, default: null },

  TotalMarks: Number, // effective total after applying both scalings — should equal 50
})

module.exports = mongoose.model('IAConfig', iaConfigSchema)