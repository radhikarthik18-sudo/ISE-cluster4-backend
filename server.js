require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors =require('cors')
const studententryroutes = require('./routes/studententryroutes')
const app = express()
const courseRoutes = require('./routes/courseRoutes')
const lessonPlanRoutes = require('./routes/lessonPlanRoutes')


app.use(cors())
app.use(express.json())
app.use('/api/students', studententryroutes)
app.use('/api/courses', courseRoutes)
const facultyRoutes = require('./routes/facultyrecordroutes')
app.use('/api/faculty', facultyRoutes)
const courseFacultyMapRoutes = require('./routes/courseFacultyMapRoutes')
app.use('/api/course-faculty-map', courseFacultyMapRoutes)
const coeRoutes = require('./routes/coeRoutes')
app.use('/api/coe', coeRoutes)
app.use('/api/lesson-plan', lessonPlanRoutes)
const attendanceRoutes = require('./routes/attendanceRoutes')
app.use('/api/attendance', attendanceRoutes)

const coAllocationRoutes = require('./routes/coAllocationRoutes')
const copoMappingRoutes = require('./routes/copoMappingRoutes')
app.use('/api/co-allocation', coAllocationRoutes)
app.use('/api/copo-mapping', copoMappingRoutes)

const timeTableRoutes = require('./routes/timeTableRoutes')
app.use('/api/timetable', timeTableRoutes)

const classTeacherRoutes = require('./routes/classTeacherRoutes')
app.use('/api/class-teacher', classTeacherRoutes)

const proctorRoutes = require('./routes/proctorRoutes')
app.use('/api/proctor', proctorRoutes)

const iaConfigRoutes = require('./routes/iaConfigRoutes')
app.use('/api/ia-config', iaConfigRoutes)

const courseFileRoutes = require('./routes/courseFileRoutes')
app.use('/api/course-file', courseFileRoutes)

mongoose.connect(process.env.MONGO_URI)
    .then(()=>console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB Connection error:',err));

app.get('/', (req, res) => {res.send('Backend is running')})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {console.log(`Server running on port ${PORT}`)})
