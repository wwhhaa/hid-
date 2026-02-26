require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function testEmail() {
    console.log(`Testing with user: ${process.env.EMAIL_USER} and pass: ${process.env.EMAIL_PASS ? '********' : 'NOT SET'}`);
    try {
        await transporter.verify();
        console.log('✅ Server is ready to take our messages');

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Test Email from Rewards App",
            text: "This is a test email to verify the Gmail App Password works correctly."
        });

        console.log("✅ Message sent: %s", info.messageId);
    } catch (error) {
        console.error("❌ Error testing email:");
        console.error(error);
    }
}

testEmail();
