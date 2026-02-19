const axios = require('axios');

async function workflow() {
    const baseURL = 'http://127.0.0.1:8080';

    // 1. Create Account
    console.log('--- Step 1: Create Account ---');
    const createParams = new URLSearchParams();
    createParams.append('username', 'testuser');
    createParams.append('password', 'password123');
    createParams.append('phoneNumber', '1234567890');
    createParams.append('email', 'test@test.com');
    createParams.append('dob', '1990-01-01');
    createParams.append('address', '123 Test St');
    createParams.append('aadharNumber', '123456789012');
    createParams.append('panNumber', 'ABCDE1234F');
    createParams.append('accountType', 'Savings');
    createParams.append('initialDeposit', '1000');

    try {
        const createRes = await axios.post(`${baseURL}/createAccount`, createParams);
        console.log('Create Status:', createRes.status);
        console.log('Create Body:', createRes.data);

        // Extract account number if possible (assuming it might be in HTML or JSON)
        let accountNumber = '';
        if (typeof createRes.data === 'string') {
            const match = createRes.data.match(/account=([A-Z0-9]+)/);
            if (match) accountNumber = match[1];
        } else if (createRes.data.accountNumber) {
            accountNumber = createRes.data.accountNumber;
        }

        if (!accountNumber) {
            console.log('Could not find account number in response. Trying 123456 as fallback.');
            accountNumber = '123456';
        }

        console.log('Using Account Number:', accountNumber);

        // 2. Login
        console.log('\n--- Step 2: Login ---');
        const loginParams = new URLSearchParams();
        loginParams.append('accountNumber', accountNumber);
        loginParams.append('username', accountNumber);
        loginParams.append('password', 'password123');

        const loginRes = await axios.post(`${baseURL}/login`, loginParams, { withCredentials: true, validateStatus: false });
        console.log('Login Status:', loginRes.status);
        console.log('Login Body:', loginRes.data);

        const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : null;
        console.log('Cookie:', cookie);

        if (cookie) {
            // 3. Get Transactions
            console.log('\n--- Step 3: Get Transactions ---');
            const txRes = await axios.get(`${baseURL}/transactions?accountId=${accountNumber}`, {
                headers: { 'Cookie': cookie },
                validateStatus: false
            });
            console.log('Transactions Status:', txRes.status);
            console.log('Transactions Body:', typeof txRes.data === 'string' ? txRes.data.substring(0, 200) : JSON.stringify(txRes.data));
        }

    } catch (error) {
        console.error('Workflow Failed:', error.message);
        if (error.response) console.log('Error Body:', error.response.data);
    }
}

workflow();
