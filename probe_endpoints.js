const http = require('http');

const paths = [
    '/login',
    '/api/login',
    '/fintech-banking/login',
    '/transactions',
    '/api/transactions',
    '/fintech-banking/transactions',
    '/transaction',
    '/api/transaction',
    '/fintech-banking/transaction',
    '/history',
    '/api/history',
    '/fintech-banking/history',
    '/balance',
    '/api/balance',
    '/fintech-banking/balance',
    '/actuator/mappings',
    '/v3/api-docs',
    '/swagger-ui/index.html'
];

async function probe(path) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8080,
            path: path,
            method: 'GET'
        }, (res) => {
            resolve({ path, status: res.statusCode });
        });
        req.on('error', (e) => resolve({ path, status: 'ERROR: ' + e.message }));
        req.end();
    });
}

async function run() {
    console.log('Probing 127.0.0.1:8080...');
    const results = await Promise.all(paths.map(probe));
    results.forEach(r => {
        if (r.status !== 404) {
            console.log(`[FOUND] ${r.path} -> ${r.status}`);
        } else {
            console.log(`[MISS]  ${r.path} -> 404`);
        }
    });
}

run();
