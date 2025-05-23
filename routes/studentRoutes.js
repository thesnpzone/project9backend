const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Student = require("../models/StudentSchema");
const Job = require("../models/JobSchema");
const StudentJobApplication = require("../models/StudentJobApplicationSchema");

const transporter = require("../utils/mailer");
const {
    isDisposableEmail,
    checkEmailDomain,

} = require("../utils/emailValidation");

const studentRegistrationEmail = require("../MailTempleat/mtStudentRegistration");

const getStudentLoginPassMail = require("../MailTempleat/mtStudentLoginPass.js");


// ======================
// Route: For sending OTP to verify Student Registration
// ======================
router.post("/send-otp", async(req, res) => {
    try {
        const { fullName, emailAddress } = req.body;

        if (!fullName || !emailAddress) {
            return res
                .status(400)
                .json({ error: "Full Name and Email are required" });
        }

        if (await isDisposableEmail(emailAddress)) {
            return res
                .status(400)
                .json({ error: "Disposable emails are not allowed" });
        }

        if (!(await checkEmailDomain(emailAddress))) {
            return res.status(400).json({ error: "Email domain is invalid" });
        }



        const existingStudent = await Student.findOne({ emailAddress });

        if (existingStudent) {
            if (existingStudent.verified === false && existingStudent.otp) {
                return res.status(400).json({
                    error: "Multiple registration attempts detected. Please wait 2 minutes before trying again. Still facing the same problem? Contact us.",
                });
            }

            if (existingStudent.verified === true && !existingStudent.password) {
                return res.status(400).json({
                    error: "Something went wrong during registration. Please Contact us.",
                });
            }

            if (existingStudent.verified === true && existingStudent.password) {
                return res.status(400).json({
                    error: "You are already registered. Please go to login.",
                });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 9000);
        const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

        const newStudent = new Student({
            fullName,
            emailAddress,
            otp,
            otpExpiresAt,
        });

        await newStudent.save();

        const { subject, html } = studentRegistrationEmail({ fullName, otp });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailAddress,
            subject,
            html,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ error: "Failed to send OTP email" });
            }
            return res.json({ message: "OTP sent successfully to your email" });
        });
    } catch (err) {
        console.error("Error in student/send-otp:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// ======================
// Route: For Verifying OTP during Student Registration
// ======================

router.post("/verify-otp", async(req, res) => {
    try {
        const { emailAddress, otp } = req.body;

        if (!emailAddress || !otp) {
            return res
                .status(400)
                .json({ error: "Email Address and OTP are required" });
        }

        const student = await Student.findOne({ emailAddress, otp });

        if (!student) {
            return res.status(400).json({ error: "Invalid OTP or Email" });
        }

        if (student.otpExpiresAt < new Date()) {
            return res.status(400).json({ error: "OTP has expired" });
        }

        await Student.updateOne({ _id: student._id }, {
            $unset: { otp: "", otpExpiresAt: "" },
            $set: { verified: true },
        });

        res.json({
            message: "OTP verified successfully, student is now verified.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ======================
// Route: For add the  remaning detils of the Students
// ======================

router.post("/complete-student-registration", async(req, res) => {
    try {
        const {
            emailAddress,
            dateOfBirth,
            gender,
            mobileNumber,
            highestQualification,
            courseOrStream,
            collegeOrUniversity,
            yearOfPassing,
            academicStatus,
            currentCity,
            state,
            pincode,
            preferredJobRole,
            jobType,
            willingToRelocate,
            expectedSalary,
            resume,
            photo,
            portfolioURL,
            linkedInURL,
            gitHubURL,
            skills,
            languages,
        } = req.body;

        if (!emailAddress) {
            return res.status(400).json({ error: "Email Address is required" });
        }

        const student = await Student.findOne({ emailAddress });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        if (!student.verified) {
            return res
                .status(400)
                .json({ error: "OTP not verified. Please verify first." });
        }

        const validateBase64Size = (base64String, label) => {
            const sizeInBytes = Buffer.from(
                base64String.split(",")[1] || "",
                "base64"
            ).length;
            if (sizeInBytes > 2 * 1024 * 1024) {
                throw new Error(`${label} must be ≤ 2MB`);
            }
        };

        if (resume) validateBase64Size(resume, "Resume");
        if (photo) validateBase64Size(photo, "Photo");

        const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
        const studentID = `SH${randomSixDigits}`;

        const hashedPassword = await bcrypt.hash(
            `Stu@${Math.floor(10000 + Math.random() * 90000)}`,
            10
        );

        Object.assign(student, {
            dateOfBirth,
            gender,
            mobileNumber,
            highestQualification,
            courseOrStream,
            collegeOrUniversity,
            yearOfPassing,
            academicStatus,
            currentCity,
            state,
            pincode,
            preferredJobRole,
            jobType,
            willingToRelocate,
            expectedSalary,
            resume,
            photo,
            portfolioURL,
            linkedInURL,
            gitHubURL,
            skills,
            languages,
            studentID,
            password: hashedPassword,
        });

        await student.save();

        res.json({
            message: "Student profile completed successfully",
            studentID,
        });
    } catch (error) {
        console.error("Error in complete-student-registration:", error.message);
        res.status(500).json({ error: error.message || "Server error" });
    }
});

// ======================
// Route: For Loging password sending Student
// ======================

router.post("/send-student-login-password", async(req, res) => {
    try {
        const { emailAddress } = req.body;

        if (!emailAddress) {
            return res.status(400).json({ error: "Email Address is required" });
        }

        const student = await Student.findOne({ emailAddress });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        if (!student.verified) {
            return res.status(400).json({
                error: "Email not verified. Please complete OTP verification first.",
            });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        student.password = hashedPassword;
        await student.save();

        const { subject, html } = getStudentLoginPassMail({
            studentName: student.fullName || "Student",
            emailAddress: student.emailAddress,
            tempPassword,
        });

        transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: student.emailAddress,
                subject,
                html,
            },
            (error, info) => {
                if (error) {
                    console.error("Error sending login password email:", error);
                    return res
                        .status(500)
                        .json({ error: "Failed to send password email" });
                }

                res.json({
                    message: "Login password sent successfully to your email.",
                });
            }
        );
    } catch (error) {
        console.error("Error in send-student-login-password:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ======================
// Route: For Student Login
// ======================

router.post("/student-login", async(req, res) => {
    try {
        const { emailAddress, password } = req.body;

        if (!emailAddress || !password) {
            return res.status(400).json({ error: "Email and Password are required" });
        }

        const student = await Student.findOne({ emailAddress });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        if (!student.verified) {
            return res.status(400).json({ error: "Email not verified" });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = jwt.sign({ studentId: student._id, email: student.emailAddress },
            process.env.JWT_SECRET, { expiresIn: "2h" }
        );

        res.cookie("studentAuthToken", token, {
            // for local host

            // httpOnly: true,
            // maxAge: 2 * 60 * 60 * 1000,
            // secure: process.env.NODE_ENV === "production",
            // sameSite: "strict",


            // for deployment
            maxAge: 7200000,
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",

        });


        res.json({ message: "Login successful" });
    } catch (error) {
        console.error("Student login error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ======================
// Route: Check Student Login Session
// ======================

router.get("/check-session", (req, res) => {
    const token = req.cookies.studentAuthToken;

    if (!token) {
        return res.json({ isLoggedIn: false });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.json({ isLoggedIn: false });
        }

        return res.json({
            isLoggedIn: true,
            studentId: decoded.studentId,
            email: decoded.email,
        });
    });
});

// ==============================
// Middleware: Verify Student Token
// ==============================
const verifyStudentToken = (req, res, next) => {
    const token = req.cookies.studentAuthToken;


    if (!token) {
        return res.status(401).json({ message: "Unauthorized! Token missing." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.employer = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized! Invalid token." });
    }
};

// ==============================
// Route: Student Logout
// ==============================

router.post("/student-logout", verifyStudentToken, (req, res) => {
    try {
        res.clearCookie("studentAuthToken", {
            httpOnly: true,

            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.json({ message: "Logout successful!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error!" });
    }
});

// ==============================
// Route: Student Get All Job
// ==============================

router.get("/all-jobs", verifyStudentToken, async(req, res) => {
    try {
        const jobs = await Job.find({})
            .select("jobRoleName jobLocation jobMode jobType createdAt companyId jobId")
            .populate("companyId", "companyName companyLogo")
            .sort({ createdAt: -1 });

        const filteredJobs = jobs.map((job) => ({
            companyName: job.companyId?.companyName || "N/A",
            companyLogo: job.companyId?.companyLogo || null,
            jobRoleName: job.jobRoleName,
            jobId: job.jobId,
            jobLocation: job.jobLocation,
            jobMode: job.jobMode,
            jobType: job.jobType,
            createdAt: job.createdAt,
        }));

        res.status(200).json(filteredJobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});


// ==============================
// Route: Student Get  Job Details
// ==============================

router.get("/job/:jobId", verifyStudentToken, async(req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findOne({ jobId: jobId })
            .populate("companyId", "companyName companyLogo companyWebsite companyAddress companyType _id");

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Construct the response
        const jobDetails = {
            _id: job._id,
            jobId: job.jobId,
            companyName: job.companyId.companyName,
            jobRoleName: job.jobRoleName,
            jobLocation: job.jobLocation,
            jobMode: job.jobMode,
            jobType: job.jobType,
            jobShift: job.jobShift,
            jobPreference: job.jobPreference,
            qualification: job.qualification,
            yearOfPassing: job.yearOfPassing,
            aggregate: job.aggregate,
            skills: job.skills,
            salary: job.salary,
            noOfPositions: job.noOfPositions,
            bond: job.bond,
            bondDuration: job.bondDuration,
            jobDescription: job.jobDescription,
            interviewMode: job.interviewMode,
            createdAt: job.createdAt,
            companyWebsite: job.companyId.companyWebsite,
            companyAddress: job.companyId.companyAddress,
            companyLogo: job.companyId.companyLogo,
            companyType: job.companyId.companyType,
            company_id: job.companyId._id,
        };

        res.status(200).json({ success: true, data: jobDetails });
    } catch (error) {
        console.error("Error fetching job details:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ==============================
// Route: Student Appliyed the job
// ==============================

router.post("/applyjob", verifyStudentToken, async(req, res) => {
    try {
        const studentId = req.employer?.studentId;
        const { jobId, companyId } = req.body;




        if (!studentId || !jobId || !companyId) {
            return res.status(400).json({ message: "All fields are required" });
        }


        const alreadyApplied = await StudentJobApplication.findOne({
            studentId,
            jobId,
        });

        if (alreadyApplied) {
            return res.status(409).json({ message: "Already applied to this job" });
        }

        const newApplication = new StudentJobApplication({
            studentId,
            jobId,
            companyId,
            appliedOn: new Date(),
        });

        await newApplication.save();

        res.status(201).json({
            message: "Job applied successfully",
            application: newApplication,
        });
    } catch (error) {
        console.error("Error applying for job:", error);
        res.status(500).json({ message: "Server error while applying for job" });
    }
});




module.exports = router;