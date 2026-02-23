const http = require('http');
const querystring = require('querystring');

http.get('http://localhost:3000/auth/login', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const csrfMatch = data.match(/name="_csrf" value="([^"]+)"/);
        const cookies = res.headers['set-cookie'];

        if (!csrfMatch || !cookies) {
            console.error('Failed to get CSRF or Cookies', { csrfMatch, cookies });
            return;
        }

        const csrfToken = csrfMatch[1];
        console.log('Got CSRF Token:', csrfToken);
        console.log('Got Cookies:', cookies);

        const postData = querystring.stringify({
            _csrf: csrfToken,
            email: 'test2@test.com',
            password: '123123'
        });

        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'Cookie': cookies.join('; ')
            }
        }, (postRes) => {
            console.log('Login Status:', postRes.statusCode);
            console.log('Login Headers:', postRes.headers);
            let postDataStr = '';
            postRes.on('data', chunk => postDataStr += chunk);
            postRes.on('end', () => {
                if (postRes.statusCode >= 400) {
                    console.log('Login failed body snippet:', postDataStr.substring(0, 100));
                } else {
                    console.log('Login successful');
                }
            });
        });

        req.on('error', console.error);
        req.write(postData);
        req.end();
    });
}).on('error', console.error);
