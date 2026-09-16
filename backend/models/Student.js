const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: {type: String, required: true, unique: true, trim: true},
  name: {type: String, required: true, trim: true},
  email: {type: String, required: true, unique: true, lowercase: true, trim: true},
  department: {type: String, required: true, enum: ["CSE", "ECE", "EEE", "MECH", "CIVIL"]},
  year: {type: Number, required: true, min: 1, max: 4},
  status: {type: String, enum: ["Active", "Inactive"], default: "Active"}
}, {timestamps: true});

module.exports = mongoose.model("Student", studentSchema);