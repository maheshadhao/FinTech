const axios = require('axios');

async function testLogin() {
    const baseURL = 'http://127.0.0.1:8080';
    console.log(`Testing Login at ${baseURL}/login`);

    try {
        const params = new URLSearchParams();
        params.append('accountNumber', '123456');
        params.append('username', '123456');
        params.append('password', 'password');

        const response = await axios.post(`${baseURL}/login`, params, {
            validateStatus: false,
            withCredentials: true
        });

        console.log('Status:', response.status);
        console.log('Headers:', JSON.stringify(response.headers, null, 2));
        console.log('Body (first 200 chars):', typeof response.data === 'string' ? response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200));

        if (response.headers['set-cookie']) {
            const cookie = response.headers['set-cookie'][0];
            console.log('\nFound Cookie:', cookie);

            console.log('\nTesting Protected Endpoint (/transactions)...');
            const res2 = await axios.get(`${baseURL}/transactions?accountId=123456`, {
                headers: { 'Cookie': cookie },
                validateStatus: false
            });
            console.log('Protected Status:', res2.status);
            console.log('Protected Body:', typeof res2.data === 'string' ? res2.data.substring(0, 200) : JSON.stringify(res2.data).substring(0, 200));
        } else {
            console.log('\nNo Set-Cookie header found.');
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testLogin();
