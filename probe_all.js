const http = require('http');

const paths = [
    '/loggedin_user',
    '/api/loggedin_user',
    '/loggedin-user',
    '/api/loggedin-user',
    '/get_loggedin_user',
    '/api/get_loggedin_user',
    '/get-loggedin-user',
    '/api/get-loggedin-user',
    '/user',
    '/api/user',
    '/profile',
    '/api/profile',
    '/login',
    '/api/login',
    '/transactions',
    '/api/transactions'
];

async function probe(path) {
    return new Promise((resolve) => {
        const req = http.get({
            hostname: '127.0.0.1',
            port: 8080,
            path: path,
        }, (res) => {
            resolve({ path, status: res.statusCode });
        });
        req.on('error', (e) => resolve({ path, status: 'ERROR' }));
    });
}

async function run() {
    console.log('START');
    for (const path of paths) {
        const r = await probe(path);
        console.log(`${r.path}:${r.status}`);
    }
    console.log('END');
}

run();
