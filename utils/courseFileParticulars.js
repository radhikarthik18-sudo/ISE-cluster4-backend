const THEORY_PARTICULARS = [
    'Calendar of Events',
    'Syllabus',
    'CO – PO – PSO mapping & justification',
    'Class Timetable',
    'Personal Timetable',
    'Lesson plan and Work done Dairy',
    'Attendance Register',
    'Delivery methods (Lecture / Role play / Flip classroom / Partial delivery of the courses by Industry experts / Tutorial / Handson training /Simulations / Model demonstrations / Group discussions.',
    'Learning Activities (AATs/CCAs): Course project/Literature review/MOOC/Case Studies/Tool exploration/ GATE based aptitude tests/Open book tests/Industry integrated learning/Business reports/Programming assignments with higher Blooms level',
    'Internal Assessment question papers',
    'Scheme & Solution for IA question paper',
    'SEE Question Paper with Scheme & Solution',
    'Rubrics for AATs',
    'Final CIE marks',
    'SEE Results with analysis',
    'Course exit survey (questionnaire + calculation)',
    'Course Outcome Attainment (excel sheets +calculation) with Gap analysis',
    'Sample CIE books (IA books and AATs) report',
]

const LAB_PARTICULARS = [
    'Calendar of Events',
    'Syllabus',
    'CO – PO – PSO mapping & justification',
    'Class Timetable',
    'Personal Timetable',
    'Lesson plan and Work done Dairy',
    'Laboratory manual',
    'Attendance Register',
    'Final CIE marks',
    'SEE Results with analysis',
    'Course exit survey (questionnaire + calculation)',
    'Course Outcome Attainment (excel sheets +calculation) with Gap analysis',
    'Sample records',
    'Sample CIE books (IA books and AATs) report',
]

function buildDefaultParticulars(fileType){
    const list = fileType === 'Laboratory' ? LAB_PARTICULARS : THEORY_PARTICULARS
    return list.map((name,idx)=>({
        SlNo: idx+1,
        Name: name,
        Status: 'Pending',
        Details: '',
    }))
}

module.exports={THEORY_PARTICULARS, LAB_PARTICULARS, buildDefaultParticulars}