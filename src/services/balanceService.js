import axios from 'axios';

export const fetchBalance = async (accountNumber, upiPin) => {
    const response = await axios.post(
        "/api/balance",
        { accountNumber, upiPin },
        {
            withCredentials: true // 🔥 REQUIRED
        }
    );
    return response.data;
};
