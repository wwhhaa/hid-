const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services (e.g., SendGrid, Mailgun) in production
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

const sendResetEmail = async (to, token) => {
    // Determine base URL depending on env
    const baseUrl = process.env.DATABASE_URL ? 'https://your-app-domain.com' : 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER || 'no-reply@rewardsapp.com',
        to: to,
        subject: 'إعادة تعيين كلمة المرور - تطبيق المكافآت',
        html: `
            <div style="direction: rtl; font-family: Arial, sans-serif; text-align: right; padding: 20px;">
                <h2 style="color: #4A90E2;">طلب إعادة تعيين كلمة المرور</h2>
                <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
                <p>الرجاء الضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">تغيير كلمة المرور</a>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">إذا لم تقم بهذا الطلب، يمكنك تجاهل هذه الرسالة.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };
