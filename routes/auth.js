const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const csrf = require('csurf');
const crypto = require('crypto');
const { sendResetEmail } = require('../utils/email');

const csrfProtection = csrf({ cookie: true });

// GET Register Page
router.get('/register', csrfProtection, (req, res) => {
    res.render('register', { csrfToken: req.csrfToken(), error: null });
});

// POST Register
router.post('/register', csrfProtection, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const result = await User.create(username, email, password);
        if (!result.success) {
            return res.render('register', { csrfToken: req.csrfToken(), error: 'Registration failed. Email or Username might be taken.' });
        }
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('register', { csrfToken: req.csrfToken(), error: 'Registration failed. Email or Username might be taken.' });
    }
});

// GET Login Page
router.get('/login', csrfProtection, (req, res) => {
    res.render('login', { csrfToken: req.csrfToken(), error: null });
});

// POST Login
router.post('/login', csrfProtection, async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.render('login', { csrfToken: req.csrfToken(), error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { csrfToken: req.csrfToken(), error: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('login', { csrfToken: req.csrfToken(), error: 'Login failed' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

// GET Forgot Password
router.get('/forgot-password', csrfProtection, (req, res) => {
    res.render('forgot-password', { csrfToken: req.csrfToken(), msg: null, error: null });
});

// POST Forgot Password
router.post('/forgot-password', csrfProtection, async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.render('forgot-password', { csrfToken: req.csrfToken(), msg: null, error: 'البريد الإلكتروني غير مسجل' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

        await User.setResetToken(email, token, expiry.toISOString());
        await sendResetEmail(email, token);

        res.render('forgot-password', { csrfToken: req.csrfToken(), msg: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني', error: null });
    } catch (e) {
        console.error("Error in /forgot-password:", e);
        res.render('forgot-password', { csrfToken: req.csrfToken(), msg: null, error: 'حدث خطأ، يرجى المحاولة لاحقاً' });
    }
});

// GET Reset Password
router.get('/reset-password/:token', csrfProtection, async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findByResetToken(token);
        if (!user || new Date(user.reset_token_expiry) < new Date()) {
            return res.render('reset-password', { csrfToken: req.csrfToken(), token: null, error: 'رابط منتهي الصلاحية أو غير صالح' });
        }
        res.render('reset-password', { csrfToken: req.csrfToken(), token, error: null });
    } catch (e) {
        res.send('حدث خطأ');
    }
});

// POST Reset Password
router.post('/reset-password/:token', csrfProtection, async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findByResetToken(token);
        if (!user || new Date(user.reset_token_expiry) < new Date()) {
            return res.render('reset-password', { csrfToken: req.csrfToken(), token, error: 'رابط منتهي الصلاحية أو غير صالح' });
        }

        await User.updatePassword(user.id, password);
        res.redirect('/auth/login');
    } catch (e) {
        res.render('reset-password', { csrfToken: req.csrfToken(), token, error: 'حدث خطأ' });
    }
});

module.exports = router;
