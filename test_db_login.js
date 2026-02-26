require('dotenv').config();
const User = require('./models/user');
const bcrypt = require('bcrypt');

async function test() {
    try {
        const email = 'poiuytrewqp353@gmail.com';
        const rawPassword = '123'; // or whatever the user is typing, wait, the user didn't specify the password, but the user said "سويت حساب جديد رجعت سجلت دخول طلعلي نفس شي" (I created a new account, logged in, got the same thing "Invalid credentials").

        const user = await User.findByEmail(email);
        console.log("User found:", user ? "YES" : "NO");
        if (user) {
            console.log("Stored Password Hash:", user.password);
            const match = await bcrypt.compare('123456', user.password);
            console.log("Password matches 123456?", match);
            const match2 = await bcrypt.compare('123123', user.password);
            console.log("Password matches 123123?", match2);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
