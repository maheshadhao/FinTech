const http = require('http');

const id = '123456';
const paths = [
    `/transactions/${id}`,
    `/api/transactions/${id}`,
    `/fintech-banking/transactions/${id}`,
    `/history/${id}`,
    `/api/history/${id}`,
    `/fintech-banking/history/${id}`,
    `/api/user/${id}/transactions`,
    `/fintech-banking/api/user/${id}/transactions`,
    `/transactions?accountId=${id}`,
    `/fintech-banking/transactions?accountId=${id}`,
    `/transactions?accountNumber=${id}`,
    `/fintech-banking/transactions?accountNumber=${id}`
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
    console.log(`Probing 127.0.0.1:8080 with ID ${id}...`);
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
