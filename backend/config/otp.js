// import nodemailer from 'nodemailer';

// // Create a transporter object using your SMTP details
// const transporter = nodemailer.createTransport({
//     host: "smtp.example.com", // Your SMTP server
//     port: 587, // Standard port
//     secure: false, // Use TLS
//     auth: {
//         user: "unaiznoushad105@gmail.com", // Your email address
//         pass: "mvzm mgwb htdv vrdd", // Your password or App Password
//     },
// });

// export default transporter;

// config/otp_config.js
// Configuration details for the email transporter and OTP settings.

// 🚨 IMPORTANT: REPLACE PLACEHOLDERS WITH YOUR GMAIL CREDENTIALS 🚨
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: "unaiznoushad105@gmail.com", // <-- REPLACE with your actual email
        pass: "mvzm mgwb htdv vrdd",            // <-- REPLACE with your 16-char App Password
    },
};

// OTP Generation Settings
const OTP_SETTINGS = {
    LENGTH: 6,         // Length of the generated OTP
    EXPIRY_MINUTES: 5, // OTP validity period (must match the TTL index in OtpModel.js)
};

// Email Content Template
const EMAIL_TEMPLATE = (otp) => ({
    subject: 'Your One-Time Password (OTP) for Verification',
    html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
            <h2 style="color: #333;">Email Verification Required</h2>
            <p>Please use the following One-Time Password (OTP) to complete your process. This code is valid for <strong>${OTP_SETTINGS.EXPIRY_MINUTES} minutes</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #4F46E5; background-color: #EEF2FF; padding: 15px 25px; border-radius: 6px; letter-spacing: 5px;">
                    ${otp}
                </span>
            </div>
            <p style="font-size: 12px; color: #777;">If you did not request this code, please ignore this email.</p>
        </div>
    `,
});


module.exports = {
    EMAIL_CONFIG,
    OTP_SETTINGS,
    EMAIL_TEMPLATE
};