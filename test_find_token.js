require('dotenv').config();
const User = require('./models/user');

async function testFindByToken() {
    try {
        await User.initDb();
        const token = '9e16f24c9fb44135c6b4d63dc10ed24a985ae2da9035264254dc192edf420e18';
        console.log('Searching for token:', token);
        const user = await User.findByResetToken(token);
        console.log('Found user:', user);
    } catch (e) {
        console.error('Error:', e);
    }
}
testFindByToken();
