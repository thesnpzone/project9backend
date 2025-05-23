const express = require("express");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const cors = require("cors");
const nodemailer = require("nodemailer");
const axios = require("axios");
const dns = require("dns");
const emailExistence = require("email-existence");
const connectDB = require("./config/db");
const companyRoutes = require('./routes/companyRoutes');
const studentRoutes = require('./routes/studentRoutes');

// ======================
// Load Environment Variables
// ======================

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    })
);


// ======================
// Initialize Body Parser
// ======================
app.use(cookieParser());
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: true, limit: "150mb" }));

// ======================
// Initialize MongoDB Connection
// ======================

connectDB();


// ======================
// Initialize Route Section
// ======================

// Company Routes

app.use('/api/company', companyRoutes);

// Students Routes
app.use('/api/student', studentRoutes);


// Dummmy route
app.get("/", (req, res) => {
    res.send("Hello this is the SkillHunt Backend by SNP ZONE");
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});