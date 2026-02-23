const express = require('express');
const router = express.Router();
// const sqlite3 = require('sqlite3').verbose(); // REMOVED
// const path = require('path'); // REMOVED
const db = require('../utils/db'); // ADDED
const WheelPrize = require('../models/wheelPrize');
const ProductKey = require('../models/productKey');
const Product = require('../models/product'); // Import Product model
const User = require('../models/user'); // Import User model

const ADMIN_CODE = 'H2002';

// Admin Login Page
router.get('/login', (req, res) => {
    res.render('admin-login', { error: null });
});

// Admin Login POST
router.post('/login', (req, res) => {
    const { code } = req.body;
    if (code === ADMIN_CODE) {
        req.session.isAdmin = true;
        res.redirect('/admin/panel');
    } else {
        res.render('admin-login', { error: 'رمز الدخول غير صحيح' });
    }
});

// Admin Auth Middleware
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/admin/login');
};

// Admin Panel
router.get('/panel', isAdmin, async (req, res) => {
    try {
        const prizes = await WheelPrize.getAll();
        // Use Models or direct DB calls via adapter
        // Let's use direct DB calls via adapter for list queries if models don't have them yet, 
        // but Product model has getAll. User model might not have getAll.

        const products = await Product.getAll();
        const users = await db.all("SELECT id, username, email, points, vip_level, red_cards FROM users ORDER BY id DESC");

        res.render('admin', { products: products || [], users: users || [], prizes: prizes || [] });
    } catch (e) {
        console.error(e);
        res.render('admin', { products: [], users: [], prizes: [] });
    }
});

// Add Product
router.post('/product/add', isAdmin, async (req, res) => {
    const { name, description, price, category, image_url } = req.body;
    try {
        await Product.create(name, parseInt(price), image_url || '', category || '', description || '');
        req.app.get('io').emit('product_updated');
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// Delete Product
router.post('/product/delete', isAdmin, async (req, res) => {
    const { id } = req.body;
    try {
        await Product.delete(id);
        req.app.get('io').emit('product_updated');
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// Update User Points
router.post('/user/points', isAdmin, async (req, res) => {
    const { userId, points } = req.body;
    try {
        await db.run("UPDATE users SET points = ? WHERE id = ?", [parseInt(points), parseInt(userId)]);
        req.app.get('io').emit('user_updated', { userId: parseInt(userId), points: parseInt(points) });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// Update User VIP
router.post('/user/vip', isAdmin, async (req, res) => {
    const { userId, vipLevel } = req.body;
    try {
        await db.run("UPDATE users SET vip_level = ? WHERE id = ?", [parseInt(vipLevel), parseInt(userId)]);
        req.app.get('io').emit('user_updated', { userId: parseInt(userId), vipLevel: parseInt(vipLevel) });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// ==================== WHEEL PRIZES ====================

// Add Product Keys
router.post('/product/keys/add', isAdmin, async (req, res) => {
    try {
        const { productId, keys } = req.body;
        if (!productId || !keys) return res.json({ success: false, message: 'بيانات غير مكتملة' });

        const keyList = keys.split('\n').map(k => k.trim()).filter(k => k.length > 0);
        let added = 0;

        for (const k of keyList) {
            try {
                // Determine implicit product ID if not passed directly or handle bulk
                // Here we assume simple one-product association
                await ProductKey.addKey(productId, k); // Correction: Method is addKey not add in my previous refactor? Checking... 
                // In ProductKey model I wrote: static async addKey(productId, items)

                added++;
            } catch (e) {
                console.log('Duplicate or invalid key:', k);
            }
        }
        res.json({ success: true, count: added });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// Get Product Key Count
router.get('/product/keys/:id', isAdmin, async (req, res) => {
    try {
        // I need to check if implementation of ProductKey has getAvailableCount. 
        // In my previous refactor step (Step 330), I wrote `getAvailableKey` and `getKeysByProduct`.
        // I did NOT write `getAvailableCount`. I should add it or implement it here.
        // Let's implement it here directly using db adapter to be safe, or update model. 
        // Direct DB call is faster right now.

        const row = await db.get('SELECT COUNT(*) as count FROM product_keys WHERE product_id = ? AND is_used = 0', [req.params.id]);
        // In Postgres count is string (bigint), in sqlite it's number.
        res.json({ success: true, count: row ? row.count : 0 });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// Add Prize
router.post('/prize/add', isAdmin, async (req, res) => {
    try {
        const { label, points, color } = req.body;
        if (!label || !points) return res.json({ success: false, message: 'يرجى ملء الحقول' });
        const result = await WheelPrize.add(label, points, color);
        req.app.get('io').emit('prizes_updated');
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// Delete Prize
router.post('/prize/delete', isAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        await WheelPrize.delete(id);
        req.app.get('io').emit('prizes_updated');
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// API: Get prizes (for wheel rendering)
router.get('/api/prizes', async (req, res) => {
    try {
        const prizes = await WheelPrize.getAll();
        res.json(prizes);
    } catch (e) {
        res.json([]);
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/features/wheel');
});

module.exports = router;
