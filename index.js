require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Serve root files like index.html, contact.html
app.use('/public', express.static(path.join(__dirname, 'public'))); // Serve public folder assets

// In-memory store for OTPs (In production, use Redis or a database)
const otpStore = {};

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Endpoint: Send OTP
app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    console.log(`Received request to send OTP to: ${email}`);
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 300000 }; // Expires in 5 minutes

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Verification Code - One Call Solutions',
        text: `Your OTP for contact form verification is: ${otp}. It is valid for 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

// Endpoint: Verify OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const storedData = otpStore[email];

    if (!storedData) {
        return res.status(400).json({ success: false, message: 'OTP not found' });
    }

    if (Date.now() > storedData.expires) {
        delete otpStore[email];
        return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (storedData.otp === otp) {
        storedData.verified = true;
        res.json({ success: true, message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

// Endpoint: Final Form Submission
app.post('/submit-form', async (req, res) => {
    const { name, email, phone, message } = req.body;
    const storedData = otpStore[email];

    if (!storedData || !storedData.verified) {
        return res.status(400).json({ success: false, message: 'Email not verified' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to site owner
        subject: 'New Contact Form Submission',
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        delete otpStore[email]; // Clear OTP after submission
        res.json({ success: true, message: 'Form submitted successfully' });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ success: false, message: 'Failed to submit form' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close the other process and try again.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
