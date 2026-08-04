const express = require('express')
const router = express.Router()
const StudentEntry = require('../models/studententrymodels')
const Faculty = require('../models/facultyrecordmodels')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')
const { generateProctorReportPdf } = require('../utils/proctorReportPdf')

router.get('/summary', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const { Semester, Section } = req.query
    const students = await StudentEntry.find({ Semester, Section })
      .select('USN StudentName ProctorFacultyID ProctorFacultyName')
      .sort({ USN: 1 })
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/assign', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const { studentIds, FacultyID, FacultyName } = req.body
    if (!studentIds || !studentIds.length || !FacultyID) {
      return res.status(400).json({ error: 'studentIds and FacultyID are required' })
    }
    const result = await StudentEntry.updateMany(
      { _id: { $in: studentIds } },
      { ProctorFacultyID: FacultyID, ProctorFacultyName: FacultyName }
    )
    res.json({ message: `${result.modifiedCount} student(s) assigned to ${FacultyName}` })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.patch('/unassign', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const { studentIds } = req.body
    if (!studentIds || !studentIds.length) {
      return res.status(400).json({ error: 'studentIds are required' })
    }
    const result = await StudentEntry.updateMany(
      { _id: { $in: studentIds } },
      { ProctorFacultyID: '', ProctorFacultyName: '' }
    )
    res.json({ message: `${result.modifiedCount} student(s) unassigned` })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/overview', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const overview = await StudentEntry.aggregate([
      { $match: { ProctorFacultyID: { $nin: [null, ''] } } },
      {
        $group: {
          _id: { FacultyID: '$ProctorFacultyID', FacultyName: '$ProctorFacultyName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.FacultyName': 1 } },
    ])
    res.json(overview)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/by-faculty/:facultyId', verifyToken, async (req, res) => {
  try {
    const students = await StudentEntry.find({ ProctorFacultyID: req.params.facultyId })
      .select('USN StudentName Semester Section StudentEmail StudentPhone')
      .sort({ USN: 1 })
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/proctor/report?Semester=7&AcademicYear=2026-27&Term=ODD
// Generates and streams a printable PDF of proctor allotment across all sections in that semester.
router.get('/report', verifyToken, requireRole('Admin', 'ProctorCoordinator'), async (req, res) => {
  try {
    const { Semester, AcademicYear, Term } = req.query
    if (!Semester) return res.status(400).json({ error: 'Semester is required' })

    const students = await StudentEntry.find({ Semester, ProctorFacultyID: { $nin: [null, ''] } })
      .select('USN StudentName Section ProctorFacultyID ProctorFacultyName')
      .sort({ Section: 1, USN: 1 })

    if (students.length === 0) {
      return res.status(404).json({ error: 'No assigned students found for this semester' })
    }

    // Group into Division -> Proctor -> students
    const divisionMap = {}
    students.forEach((s) => {
      divisionMap[s.Section] = divisionMap[s.Section] || {}
      divisionMap[s.Section][s.ProctorFacultyID] = divisionMap[s.Section][s.ProctorFacultyID] || {
        FacultyID: s.ProctorFacultyID,
        FacultyName: s.ProctorFacultyName,
        students: [],
      }
      divisionMap[s.Section][s.ProctorFacultyID].students.push({ USN: s.USN, StudentName: s.StudentName })
    })

    // Attach Phone/Email for each unique proctor
    const facultyIDs = [...new Set(students.map((s) => s.ProctorFacultyID))]
    const facultyRecords = await Faculty.find({ FacultyID: { $in: facultyIDs } }).select('FacultyID Email Phone')
    const facultyContactLookup = {}
    facultyRecords.forEach((f) => {
      facultyContactLookup[f.FacultyID] = { Phone: f.Phone, Email: f.Email }
    })

    const divisions = Object.entries(divisionMap).map(([sectionName, proctors]) => ({
      name: sectionName,
      proctorBlocks: Object.values(proctors).map((block) => ({
        ...block,
        Phone: facultyContactLookup[block.FacultyID]?.Phone,
        Email: facultyContactLookup[block.FacultyID]?.Email,
      })),
    }))

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="Proctor_Allotment_Sem${Semester}.pdf"`)

    const doc = generateProctorReportPdf({ semester: Semester, academicYear: AcademicYear, term: Term, divisions })
    doc.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router