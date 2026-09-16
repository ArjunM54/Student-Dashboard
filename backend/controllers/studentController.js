const Student = require("../models/Student");

// READ all
exports.getStudents = async (req, res) => {
  try {
    const {search, department, status} = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        {name: {$regex: search, $options: "i"}},
        {studentId: {$regex: search, $options: "i"}},
        {email: {$regex: search, $options: "i"}}
      ];
    }

    const students = await Student.find(filter).sort({createdAt: -1});
    res.json(students);
  } catch (error) {
    res.status(500).json({message: "Failed to fetch students"});
  }
};

// READ one
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({message: "Student not found"});
    res.json(student);
  } catch {
    res.status(400).json({message: "Invalid student ID"});
  }
};

// CREATE
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({message: "Student ID or email already exists"});
    }
    res.status(400).json({message: "Invalid student data"});
  }
};

// UPDATE
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true, runValidators: true}
    );
    if (!student) return res.status(404).json({message: "Student not found"});
    res.json(student);
  } catch {
    res.status(400).json({message: "Could not update student"});
  }
};

// DELETE
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({message: "Student not found"});
    res.json({message: "Student deleted successfully"});
  } catch {
    res.status(400).json({message: "Invalid student ID"});
  }
};