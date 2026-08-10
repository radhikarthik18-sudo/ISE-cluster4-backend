const mongoose=require('mongoose')

const particularSchema = new mongoose.Schema(
    {
        SlNo: { type: Number, required: true },
        Name: { type: String, required: true },
        Status: { type: String, enum: ['Completed','Pending'], default: 'Pending'},
        Details: {type: String, default: ''},
        UpdatedAt: Date,
    },
    { 
        _id: false
    }
)

const courseFileSchema = new mongoose.Schema(
    {
        CourseCode: { type: String, required: true},
        FileType: { type: String, enum: ['Theory','Laboratory'], required: true},
        CourseTitle: String,
        Semester: String,
        Period: String,
        AcademicYear: String,
        Batch: String,
        Credits: String,
        LTPS: String,
        CIEMarks: String,
        SEEMarks: String,
        CourseCoordinatorName: String,
        Particulars: [particularSchema],

    }
)

module.exports=mongoose.model('CourseFile', courseFileSchema)