const mongoose = require('mongoose')

const subQuestionSchema = new mongoose.Schema(
  {
    Label: String, // 'a' | 'b' | 'c' | '' (no sub-parts)
    BloomsLevel: { type: String, enum: ['L1', 'L2', 'L3', 'L4', 'L5'] },
    COs: [String],
    Marks: Number,
  },
  { _id: false }
)

const optionSchema = new mongoose.Schema(
  {
    Label: String, // e.g. "Q1" or "Q1 (OR)"
    SubQuestions: [subQuestionSchema],
  },
  { _id: false }
)

const mainQuestionSchema = new mongoose.Schema(
  {
    Number: { type: Number, required: true },
    AnswerMode: { type: String, enum: ['single', 'either'], default: 'single' }, // single = 1 of 1, either = 1 of 2
    Options: [optionSchema],
  },
  { _id: false }
)

const iaQuestionPaperSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true },
  ComponentKey: { type: String, required: true }, // e.g. 'ia1'
  MainQuestions: [mainQuestionSchema],
  TotalMarks: Number,
})

iaQuestionPaperSchema.index({ CourseCode: 1, ComponentKey: 1 }, { unique: true })

module.exports = mongoose.model('IAQuestionPaper', iaQuestionPaperSchema)