const http = require('http');
const querystring = require('querystring');

function getCsrf(path, cookies = []) {
    return new Promise((resolve) => {
        const reqOpts = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            headers: {}
        };
        if (cookies.length) reqOpts.headers['Cookie'] = cookies.join('; ');

        http.get(reqOpts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const csrfMatch = data.match(/name="_csrf" value="([^"]+)"/);
                const newCookies = res.headers['set-cookie'] || [];
                resolve({
                    token: csrfMatch ? csrfMatch[1] : null,
                    cookies: [...cookies, ...newCookies]
                });
            });
        });
    });
}

async function run() {
    let { token, cookies } = await getCsrf('/auth/register');
    console.log('Reg CSRF:', token);

    // Register
    const postData = querystring.stringify({
        _csrf: token,
        username: 'test_auto_2',
        email: 'test_auto_2@test.com',
        password: 'password123'
    });

    const regReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Cookie': cookies.join('; ')
        }
    }, async (res) => {
        console.log('Reg Status:', res.statusCode);
        const newCookies = res.headers['set-cookie'] || [];
        cookies = [...cookies, ...newCookies];

        // Login
        const loginData = await getCsrf('/auth/login', cookies);

        const loginPostData = querystring.stringify({
            _csrf: loginData.token,
            email: 'test_auto_2@test.com',
            password: 'password123'
        });

        const loginReq = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(loginPostData),
                'Cookie': loginData.cookies.join('; ')
            }
        }, (res2) => {
            console.log('Login Status:', res2.statusCode);
            res2.on('data', () => { }); // consume
        });
        loginReq.write(loginPostData);
        loginReq.end();
    });

    regReq.write(postData);
    regReq.end();
}
run();
