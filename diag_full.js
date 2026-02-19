const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function testFullFlow() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({
        baseURL: 'http://127.0.0.1:8080',
        jar,
        withCredentials: true
    }));

    const accountNumber = '123456';
    const password = 'password';

    console.log('--- Step 1: Login ---');
    try {
        const params = new URLSearchParams();
        params.append('accountNumber', accountNumber);
        params.append('username', accountNumber);
        params.append('password', password);

        const loginRes = await client.post('/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('Login Status:', loginRes.status);
        console.log('Login Data:', loginRes.data);
        console.log('Cookies:', await jar.getCookieString('http://127.0.0.1:8080'));

        console.log('\n--- Step 2: Fetch Transactions (Prefixed) ---');
        const txRes = await client.get(`/fintech-banking/transactions?accountId=${accountNumber}`, {
            validateStatus: false
        });
        console.log('Prefixed Status:', txRes.status);
        console.log('Prefixed Body:', JSON.stringify(txRes.data).substring(0, 200));

        console.log('\n--- Step 3: Fetch Transactions (Root) ---');
        const txRes2 = await client.get(`/transactions?accountId=${accountNumber}`, {
            validateStatus: false
        });
        console.log('Root Status:', txRes2.status);
        console.log('Root Body:', JSON.stringify(txRes2.data).substring(0, 200));

    } catch (error) {
        console.error('Flow Failed:', error.message);
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Body:', error.response.data);
        }
    }
}

testFullFlow();
