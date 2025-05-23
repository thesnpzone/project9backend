const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    officialEmail: { type: String, required: true },
    companyType: {
        type: String,
        enum: [
            "Private Limited",
            "Public Limited",
            "LLP",
            "Sole Proprietorship",
            "Partnership Firm",
            "NGO / Non-Profit",
            "Government Organization",
            "Others",
        ],
    },
    industryType: {
        type: String,
        enum: [
            "Bootstrap",
            "Startup",
            "Growth Stage",
            "Funded",
            "MNC",
            "Enterprise",
        ],
    },
    companyWebsite: { type: String },
    yearOfEstablishment: { type: Number },
    companyDescription: { type: String },

    companyPhoneNumber: { type: String },
    companyAddress: { type: String },

    contactPersonName: { type: String },
    contactPersonDesignation: { type: String },
    contactPersonEmail: { type: String },
    contactPersonMobile: { type: String },

    gstNumber: { type: String },

    otp: { type: String },
    otpExpiresAt: { type: Date, index: { expires: "2m" } },
    verified: { type: Boolean, default: false },

    password: { type: String },

    companyPAN: {
        type: String,
        validate: {
            validator: function(v) {
                const sizeInBytes = Buffer.from(v || "", "base64").length;
                return sizeInBytes <= 2 * 1024 * 1024;
            },
            message: "PAN Card image must be ≤ 2MB",
        },
    },

    companyLogo: {
        type: String,
        validate: {
            validator: function(v) {
                const sizeInBytes = Buffer.from(v || "", "base64").length;
                return sizeInBytes <= 2 * 1024 * 1024;
            },
            message: "Company Logo image must be ≤ 2MB",
        },
    },

    registrationCertificate: {
        type: String,
        validate: {
            validator: function(v) {
                const sizeInBytes = Buffer.from(v || "", "base64").length;
                return sizeInBytes <= 2 * 1024 * 1024;
            },
            message: "Registration Certificate must be ≤ 2MB",
        },
    },
}, { timestamps: true });

module.exports = mongoose.model("CompanySchema", companySchema);