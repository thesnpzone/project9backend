const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Company = require("../models/CompanySchema");
const Job = require("../models/JobSchema");
const StudentJobApplication = require("../models/StudentJobApplicationSchema");

const Student = require("../models/StudentSchema");

const transporter = require("../utils/mailer");
const {
  isDisposableEmail,
  checkEmailDomain,
} = require("../utils/emailValidation");
const companyRegistrationEmail = require("../MailTempleat/mtCompanyRegistration");
const companyRegistrationConfirmationEmail = require("../MailTempleat/mtCompanyRegistrationConfirmationMail");
const getCompanyLoginPassMail = require("../MailTempleat/mtCompanyLoginPass");

// ======================
// Route: For sending OTP to verify the Registration
// ======================

router.post("/send-otp", async (req, res) => {
  try {
    const { companyName, officialEmail } = req.body;

    if (!companyName || !officialEmail) {
      return res
        .status(400)
        .json({ error: "Company Name and Official Email are required" });
    }

    if (await isDisposableEmail(officialEmail)) {
      return res
        .status(400)
        .json({ error: "Disposable emails are not allowed" });
    }

    if (!(await checkEmailDomain(officialEmail))) {
      return res.status(400).json({ error: "Email domain is invalid" });
    }

    const existingCompany = await Company.findOne({ officialEmail });

    if (existingCompany) {
      if (existingCompany.verified === false && existingCompany.otp) {
        return res.status(400).json({
          error:
            "Multiple registration attempts detected. Please wait 10 minutes before trying again. Still facing the same problem? Contact us.",
        });
      }

      if (existingCompany.verified === true && !existingCompany.password) {
        return res.status(400).json({
          error: "Something went wrong during registration. Please Contact us.",
        });
      }

      if (existingCompany.verified === true && existingCompany.password) {
        return res.status(400).json({
          error: "You are already registered. Please go to login.",
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

    const newCompany = new Company({
      companyName,
      officialEmail,
      otp,
      otpExpiresAt,
    });

    await newCompany.save();

    const { subject, html } = companyRegistrationEmail({ companyName, otp });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: officialEmail,
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
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ======================
// Route: For Verift the  sent  OTP to verify the Registration
// ======================

router.post("/verify-otp", async (req, res) => {
  try {
    const { officialEmail, otp } = req.body;

    if (!officialEmail || !otp) {
      return res
        .status(400)
        .json({ error: "Official Email and OTP are required" });
    }

    const company = await Company.findOne({ officialEmail, otp });
    if (!company) {
      return res.status(400).json({ error: "Invalid OTP or Email" });
    }

    if (company.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    await Company.updateOne(
      { _id: company._id },
      {
        $unset: { otp: "", otpExpiresAt: "" },
        $set: { verified: true },
      }
    );

    res.json({
      message: "OTP verified successfully, company is now verified.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// Route: For add the  remaning detils of the company
// ======================

router.post("/complete-registration", async (req, res) => {
  try {
    const {
      officialEmail,
      companyType,
      industryType,
      companyWebsite,
      yearOfEstablishment,
      companyDescription,
      companyPhoneNumber,
      companyAddress,
      contactPersonName,
      contactPersonDesignation,
      contactPersonEmail,
      contactPersonMobile,
      companyPAN,
      gstNumber,
      registrationCertificate,
      companyLogo,
    } = req.body;

    if (!officialEmail) {
      return res.status(400).json({ error: "officialEmail is required" });
    }

    const company = await Company.findOne({ officialEmail });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (!company.verified) {
      return res
        .status(400)
        .json({ error: "OTP not verified. Please verify first." });
    }

    const validateBase64Size = (base64String, label) => {
      const sizeInBytes = Buffer.from(base64String || "", "base64").length;
      if (sizeInBytes > 2 * 1024 * 1024) {
        throw new Error(`${label} must be ≤ 2MB`);
      }
    };

    if (companyPAN) validateBase64Size(companyPAN, "Company PAN");
    if (companyLogo) validateBase64Size(companyLogo, "Company Logo");
    if (registrationCertificate)
      validateBase64Size(registrationCertificate, "Registration Certificate");

    company.companyType = companyType || company.companyType;
    company.industryType = industryType || company.industryType;
    company.companyWebsite = companyWebsite || company.companyWebsite;
    company.yearOfEstablishment =
      yearOfEstablishment || company.yearOfEstablishment;
    company.companyDescription =
      companyDescription || company.companyDescription;
    company.companyPhoneNumber =
      companyPhoneNumber || company.companyPhoneNumber;
    company.companyAddress = companyAddress || company.companyAddress;
    company.contactPersonName = contactPersonName || company.contactPersonName;
    company.contactPersonDesignation =
      contactPersonDesignation || company.contactPersonDesignation;
    company.contactPersonEmail =
      contactPersonEmail || company.contactPersonEmail;
    company.contactPersonMobile =
      contactPersonMobile || company.contactPersonMobile;
    company.companyPAN = companyPAN || company.companyPAN;
    company.gstNumber = gstNumber || company.gstNumber;
    company.registrationCertificate =
      registrationCertificate || company.registrationCertificate;
    company.companyLogo = companyLogo || company.companyLogo;

    const hashedPassword = await bcrypt.hash(
      Math.random().toString(36).slice(-8),
      10
    );

    company.password = hashedPassword;

    await company.save();

    const { subject, html } = companyRegistrationConfirmationEmail({
      companyName: company.companyName,
      officialEmail: company.officialEmail,
    });

    transporter.sendMail(
      {
        from: process.env.EMAIL_USER,
        to: company.officialEmail,
        subject,
        html,
      },
      (err, info) => {
        if (err) {
          console.error("Confirmation email failed:", err);
        } else {
          console.log("Confirmation email sent:", info.response);
        }
      }
    );

    res.json({ message: "Company details updated successfully" });
  } catch (error) {
    console.error("Error in complete-registration:", error.message);
    res.status(500).json({ error: error.message || "Server error" });
  }
});

// ======================
// Route: For Loging password sending Employer
// ======================

router.post("/send-login-password", async (req, res) => {
  try {
    const { officialEmail } = req.body;

    if (!officialEmail) {
      return res.status(400).json({ error: "Official Email is required" });
    }

    const company = await Company.findOne({ officialEmail });

    if (!company) {
      return res
        .status(404)
        .json({ error: "Company with this email does not exist" });
    }

    if (!company.verified) {
      return res.status(400).json({
        error: "Email not verified. Please complete OTP verification first.",
      });
    }

    const tempPassword = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    company.password = hashedPassword;
    await company.save();

    const { subject, html } = getCompanyLoginPassMail({
      companyName: company.companyName,
      officialEmail: company.officialEmail,
      tempPassword,
    });

    transporter.sendMail(
      {
        from: process.env.EMAIL_USER,
        to: company.officialEmail,
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
    console.error("Error in send-login-password:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// Route: For Company Login
// ======================

router.post("/company-login", async (req, res) => {
  try {
    const { officialEmail, password } = req.body;

    const company = await Company.findOne({ officialEmail });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (!company.verified) {
      return res.status(400).json({ error: "Email not verified" });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { companyId: company._id, email: company.officialEmail },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("companyAuthToken", token, {
      // for local host

      //     httpOnly: true,
      //     maxAge: 2 * 60 * 60 * 1000,
      //     secure: process.env.NODE_ENV === "production",
      //     sameSite: "strict",

      // for deployment
      maxAge: 7200000,
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// Route: Check Company Login Session
// ======================

router.get("/check-session", (req, res) => {
  const token = req.cookies.companyAuthToken;

  if (!token) {
    return res.json({ isLoggedIn: false });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.json({ isLoggedIn: false });
    }

    return res.json({
      isLoggedIn: true,
      companyId: decoded.companyId,
      email: decoded.email,
    });
  });
});

// ==============================
// Middleware: Verify Employer Token
// ==============================
const verifyEmployerToken = (req, res, next) => {
  const token = req.cookies.companyAuthToken;

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
// Route: Employer Logout
// ==============================
router.post("/employer-logout", verifyEmployerToken, (req, res) => {
  try {
    res.clearCookie("companyAuthToken", {
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
// Funcation: Helper funcation  to generate 6-digit random number
// ==============================
//
function generateRandomDigits(length = 6) {
  let digits = "";
  for (let i = 0; i < length; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

// ==============================
// Route: Job Post Created
// ==============================

router.post("/job-create", verifyEmployerToken, async (req, res) => {
  try {
    const {
      companyId,
      jobRoleName,
      jobLocation,
      jobPreference,
      jobType,
      jobShift,
      qualification,
      yearOfPassing,
      aggregate,
      skills,
      salary,
      noOfPositions,
      bond,
      bondDuration,
      jobDescription,
      interviewMode,
      jobMode,
    } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const namePrefix = company.companyName
      ? company.companyName.substring(0, 2).toUpperCase()
      : "XX";

    let jobId;
    let jobIdExists = true;

    while (jobIdExists) {
      jobId = namePrefix + generateRandomDigits(6);
      const existingJob = await Job.findOne({ jobId });
      if (!existingJob) jobIdExists = false;
    }

    const newJob = new Job({
      jobId,
      companyId,
      jobRoleName,
      jobLocation,
      jobPreference,
      jobType,
      jobShift,
      qualification,
      yearOfPassing,
      aggregate,
      skills,
      salary,
      noOfPositions,
      bond,
      bondDuration,
      jobDescription,
      interviewMode,
      jobMode,
    });

    const savedJob = await newJob.save();

    res.status(201).json({
      message: "Job posted successfully",
      job: savedJob,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==============================
// Route: Get the Job Post of the perticulat company
// ==============================

// ==============================
// Route: Get selected Job Post details of a particular company
// ==============================

router.get("/jobs/:companyId", verifyEmployerToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required." });
    }

    const company = await Company.findById(companyId).select(
      "companyName companyLogo"
    );
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found." });
    }

    const jobs = await Job.find({ companyId }).select(
      "createdAt jobRoleName qualification salary jobLocation jobId companyId"
    );

    const jobsWithCompanyName = jobs.map((job) => ({
      ...job._doc,
      companyName: company.companyName,
      companyLogo: company.companyLogo,
    }));

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs: jobsWithCompanyName,
    });
  } catch (error) {
    console.error("Error fetching company jobs:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching jobs." });
  }
});

// ==============================
// Route: Get the Job Post of the particular company with details
// ==============================

router.get("/jobs/:companyId/:jobId", verifyEmployerToken, async (req, res) => {
  try {
    const { companyId, jobId } = req.params;

    if (!companyId || !jobId) {
      return res.status(400).json({
        success: false,
        message: "Company ID and Job ID are required.",
      });
    }

    const job = await Job.findOne({ jobId: jobId, companyId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found for this company.",
      });
    }

    const company = await Company.findById(companyId).select(
      "companyName companyLogo"
    );
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    return res.status(200).json({
      success: true,
      job: {
        ...job._doc,
        companyName: company.companyName,
        companyLogo: company.companyLogo,
      },
    });
  } catch (error) {
    console.error("Error fetching job detail:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job details.",
    });
  }
});

// ==============================
// Route: Get the  particular Student with details
// ==============================

router.get("/student/:studentID", verifyEmployerToken, async (req, res) => {
  try {
    const { studentID } = req.params;

    if (!studentID) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required.",
      });
    }

    const student = await Student.findOne({ studentID: studentID }).select(
      "-password -__v"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Error fetching student detail:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching student details.",
    });
  }
});

// ==============================
// Route: Get the Job Application of the particular company
// ==============================

router.get("/applications", verifyEmployerToken, async (req, res) => {
  try {
    const companyId = req.employer?.companyId;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const applications = await StudentJobApplication.find({ companyId })
      .populate("studentId", "fullName email mobile resume studentID")
      .populate("jobId", "jobRoleName jobLocation jobMode jobType jobId")
      .sort({ appliedOn: -1 });

    res.status(200).json({
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    console.error("Error fetching student applications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
