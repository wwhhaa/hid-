const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/auth/login');
};

// Dashboard (Now redirects to Wheel)
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.redirect('/features/wheel');
});

// Redirect root to dashboard -> wheel
router.get('/', (req, res) => {
    res.redirect('/features/wheel');
});

// Feature Routes
const featuresRouter = express.Router();

featuresRouter.use(isAuthenticated);

const WheelPrize = require('../models/wheelPrize');

featuresRouter.get('/wheel', async (req, res) => {
    const user = await User.findById(req.session.userId);
    try {
        const prizes = await WheelPrize.getAll();
        res.render('wheel', { user, prizes });
    } catch (e) {
        res.render('wheel', { user, prizes: [] });
    }
});

featuresRouter.post('/spin-wheel', async (req, res) => {
    try {
        const result = await User.useRedCard(req.session.userId);
        if (!result.success) {
            return res.json({ success: false, message: result.message });
        }

        // Get prizes from DB
        const prizes = await WheelPrize.getAll();
        if (prizes.length === 0) {
            return res.json({ success: false, message: 'لا توجد جوائز في العجلة' });
        }

        // Pick random prize
        const winIndex = Math.floor(Math.random() * prizes.length);
        const won = prizes[winIndex];
        const earned = won.points;

        await User.updatePoints(req.session.userId, earned);

        // Calculate degree to land on winning segment
        // We now send the index to the client, let client handle the animation

        res.json({
            success: true,
            earned: earned,
            winIndex: winIndex,
            message: `مبروك! ربحت ${earned} نقطة`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

const Product = require('../models/product');
const ProductKey = require('../models/productKey');

featuresRouter.get('/store', async (req, res) => {
    const user = await User.findById(req.session.userId);
    try {
        const products = await Product.getAll();
        res.render('store', { user, products });
    } catch (err) {
        console.error(err);
        res.render('store', { user, products: [] });
    }
});

featuresRouter.post('/store/buy', async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.userId;
        const user = await User.findById(userId);

        // Get product details (price)
        const products = await Product.getAll();
        const product = products.find(p => p.id == productId);

        if (!product) return res.json({ success: false, message: 'المنتج غير موجود' });
        if (user.points < product.price) return res.json({ success: false, message: 'نقاطك غير كافية' });

        // Check for available key
        const key = await ProductKey.getAvailableKey(productId);
        if (!key) return res.json({ success: false, message: 'نفذت الكمية لهذا المنتج' });

        // Transaction: Deduct points
        await User.updatePoints(userId, -product.price);

        // Mark key as used
        await ProductKey.markUsed(key.id, userId);

        res.json({ success: true, key: key.key_value, message: 'تم الشراء بنجاح! كود الهدية: ' + key.key_value });

    } catch (e) {
        console.error(e);
        res.json({ success: false, message: 'Server Error' });
    }
});

featuresRouter.get('/tasks', async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('tasks', { user });
});

featuresRouter.post('/watch-ad', async (req, res) => {
    try {
        const result = await User.incrementAdWatch(req.session.userId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

featuresRouter.get('/profile', async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('profile', { user });
});

featuresRouter.get('/chest', async (req, res) => {
    const user = await User.findById(req.session.userId);
    // Simple logic for chest: just a view for now, usually needs time check
    res.render('chest', { user });
});

featuresRouter.get('/vip', async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('vip', { user });
});

featuresRouter.post('/vip/buy', async (req, res) => {
    try {
        const { level } = req.body;
        const currentLevel = parseInt(level);

        // In a real app, verify payment here. 
        // For now, we mock success.

        await User.setVipLevel(req.session.userId, currentLevel);

        // Award instant benefits if needed, or just rely on daily check
        res.json({ success: true, message: 'تم الاشتراك بنجاح!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

featuresRouter.post('/vip/claim-daily', async (req, res) => {
    try {
        const result = await User.checkDailyVipReward(req.session.userId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = { dashboardMsg: router, featuresRouter };
