const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema({
  TopicName: { type: String, required: true },
  TeachingMethod: { type: String, required: true },
})

const moduleSchema = new mongoose.Schema({
  ModuleNumber: String,
  Hours: String,
  Topics: [topicSchema],
})

const lessonPlanSchema = new mongoose.Schema({
  CourseCode: { type: String, required: true },
  CourseTitle: { type: String, required: true },
  Modules: [moduleSchema],
})

const LessonPlan = mongoose.model('LessonPlan', lessonPlanSchema)
module.exports = LessonPlan