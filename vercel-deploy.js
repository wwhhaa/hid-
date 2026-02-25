const os = require('os');
const originalUserInfo = os.userInfo;

process.env.USERNAME = 'developer';
process.env.USER = 'developer';

os.userInfo = function (options) {
    const info = originalUserInfo(options);
    if (info && info.username) {
        info.username = 'developer';
    }
    return info;
};

require('vercel/dist/index.js');
