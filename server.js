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


mongoose.connect(process.env.MONGO_URI)
    .then(()=>console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB Connection error:',err));

app.get('/', (req, res) => {res.send('Backend is running')})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {console.log(`Server running on port ${PORT}`)})
