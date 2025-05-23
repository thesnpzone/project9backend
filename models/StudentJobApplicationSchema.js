const mongoose = require("mongoose");

const StudentJobApplicationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobSchema",
        required: true,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    appliedOn: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("StudentJobApplication", StudentJobApplicationSchema);