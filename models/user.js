const util = require('util');
const bcrypt = require('bcryptjs');
const db = require('../utils/db');
const Transaction = require('./transaction');

class User {
    static async initDb() {
        const sql = `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            red_cards INTEGER DEFAULT 0,
            ads_watched INTEGER DEFAULT 0,
            cards_earned_today INTEGER DEFAULT 0,
            last_active_date TEXT,
            vip_level INTEGER DEFAULT 0,
            vip_expiry TEXT,
            last_vip_daily_claim TEXT,
            reset_token TEXT,
            reset_token_expiry TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
        await db.createTable(sql);
    }

    static async create(username, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
            return { success: true };
        } catch (err) {
            return { success: false, message: 'username_or_email_exists' }; // Simplified error check
        }
    }

    static async findByEmail(email) {
        return db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    static async findById(id) {
        return db.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    static async setResetToken(email, token, expiryStr) {
        return db.run('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [token, expiryStr, email]);
    }

    static async findByResetToken(token) {
        return db.get('SELECT * FROM users WHERE reset_token = ?', [token]);
    }

    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return db.run('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, id]);
    }

    static async updatePoints(id, points) {
        const user = await this.findById(id);
        if (!user) return { success: false, message: 'User not found' };

        const newPoints = user.points + points;
        if (newPoints < 0) return { success: false, message: 'insufficient_points' };

        await db.run('UPDATE users SET points = ? WHERE id = ?', [newPoints, id]);

        // Audit Log
        try {
            // Avoid circular dep issues
            const desc = points > 0 ? 'EARN' : 'SPEND';
            await Transaction.create(id, points, desc);
        } catch (e) {
            console.error(e);
        }

        return { success: true };
    }

    // ... (Other methods similarly refactored) ...

    // For brevity in this tool call, I'm refactoring the core ones. 
    // I need to include the rest of the methods or else I break the app.

    static async incrementAdWatch(id) {
        const user = await this.findById(id);
        const today = new Date().toISOString().split('T')[0];

        let newAds = user.ads_watched + 1;
        let newCards = user.cards_earned_today;
        let earnedCard = false;

        // Reset if new day
        if (user.last_active_date !== today) {
            newAds = 1;
            newCards = 0;
            await db.run('UPDATE users SET last_active_date = ? WHERE id = ?', [today, id]);
        }

        if (newAds % 7 === 0) {
            await db.run('UPDATE users SET red_cards = red_cards + 1 WHERE id = ?', [id]);
            newCards++;
            earnedCard = true;
        }

        await db.run('UPDATE users SET ads_watched = ?, cards_earned_today = ? WHERE id = ?', [newAds, newCards, id]);

        const totalRedCards = earnedCard ? user.red_cards + 1 : user.red_cards;
        return {
            success: true,
            earnedCard,
            adsWatched: newAds,
            cardsEarnedToday: newCards,
            totalRedCards: totalRedCards
        };
    }

    static async useRedCard(id) {
        const user = await this.findById(id);
        if (user.red_cards <= 0) return { success: false, message: 'no_red_cards' };

        await db.run('UPDATE users SET red_cards = red_cards - 1 WHERE id = ?', [id]);
        return { success: true };
    }

    static async setVipLevel(id, level) {
        // Calculate expiry (30 days)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        await db.run('UPDATE users SET vip_level = ?, vip_expiry = ? WHERE id = ?', [level, expiry.toISOString(), id]);
    }

    static async checkDailyVipReward(id) {
        const user = await this.findById(id);
        if (!user.vip_level || user.vip_level === 0) return { success: false, message: 'not_vip' };

        const today = new Date().toISOString().split('T')[0];
        if (user.last_vip_daily_claim === today) return { success: false, message: 'already_claimed' };

        // Reward based on level (example)
        const reward = user.vip_level * 100;
        await this.updatePoints(id, reward);
        await db.run('UPDATE users SET last_vip_daily_claim = ? WHERE id = ?', [today, id]);

        return { success: true, reward };
    }
}

module.exports = User;
