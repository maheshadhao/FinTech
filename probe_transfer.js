const http = require('http');

const paths = [
    '/transfer',
    '/api/transfer',
    '/fintech-banking/transfer',
    '/api/v1/transfer'
];

async function probe(path) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8080,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            resolve({ path, status: res.statusCode });
        });
        req.on('error', (e) => resolve({ path, status: 'ERROR: ' + e.message }));
        req.end('{}');
    });
}

async function run() {
    console.log('Finding working transfer endpoint...\n');
    const results = await Promise.all(paths.map(probe));

    results.forEach(r => {
        console.log(`${r.path} -> ${r.status}`);
    });
}

run();
