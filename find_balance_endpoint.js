const http = require('http');

const accountId = '123456';
const upiPin = '123456';

const paths = [
    `/balance?accountId=${accountId}`,
    `/balance?accountId=${accountId}&upiPin=${upiPin}`,
    `/fintech-banking/balance?accountId=${accountId}`,
    `/fintech-banking/balance?accountId=${accountId}&upiPin=${upiPin}`,
    `/api/balance?accountId=${accountId}`,
    `/api/balance?accountId=${accountId}&upiPin=${upiPin}`,
    `/account/balance?accountId=${accountId}`,
    `/account/${accountId}/balance`,
    `/fintech-banking/account/balance?accountId=${accountId}`,
    `/accounts/${accountId}/balance`,
    `/getBalance?accountId=${accountId}`,
    `/checkBalance?accountId=${accountId}`,
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
    console.log('Finding working balance endpoint...\n');
    const results = await Promise.all(paths.map(probe));

    console.log('=== Results ===');
    results.forEach(r => {
        if (r.status === 404) {
            console.log(`❌ ${r.path} -> 404 NOT FOUND`);
        } else if (r.status === 401) {
            console.log(`✅ ${r.path} -> 401 (EXISTS, needs auth)`);
        } else {
            console.log(`⚠️  ${r.path} -> ${r.status}`);
        }
    });

    const working = results.filter(r => r.status !== 404 && !r.status.toString().startsWith('ERROR'));
    console.log(`\n=== ${working.length} Working Endpoint(s) Found ===`);
    working.forEach(r => console.log(`USE: ${r.path}`));
}

run();
