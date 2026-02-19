import axios from 'axios';

// Set global axios defaults (though we primarily use the 'api' instance)
axios.defaults.withCredentials = true;

const API_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important: Send cookies (JSESSIONID) with requests
});

// Add a request interceptor to include JWT token if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const loginUser = async (credentials) => {
    try {
        const response = await api.post('/login', {
            accountNumber: credentials.accountNumber,
            password: credentials.password
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createAccount = async (accountData) => {
    const payload = {
        ...accountData,
        AadharNumber: accountData.aadharNumber,
        DOB: accountData.dob
    };
    try {
        const response = await api.post('/createAccount', payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const depositFunds = async (data) => {
    try {
        const response = await api.post('/api/deposit', {
            accountId: data.accountId,
            amount: data.amount
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const transferFunds = async (data) => {
    try {
        const response = await api.post('/api/transfer', {
            fromAccount: data.sourceAccountId,
            toAccount: data.targetAccountId,
            amount: Number(data.amount),
            upiPin: data.upiPin
        });
        return response.data;
    } catch (err) {
        console.error('Transfer Failed:', err);
        throw err;
    }
};

export const getBalance = async (accountId, upiPin) => {
    try {
        const response = await api.get(`/api/balance?accountId=${accountId}&upiPin=${upiPin}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getTransactions = async (accountId) => {
    try {
        const response = await api.get(`/api/history?accountId=${accountId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const searchUsers = async (query) => {
    try {
        const response = await api.get(`/api/search-user?query=${query}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const sendChatMessage = async (message) => {
    try {
        const response = await api.post('/api/chat', { message: message });
        return response.data.response;
    } catch (error) {
        console.error("AI Chat Error:", error.message);
        throw error;
    }
};

export const downloadStatement = async (startDate, endDate) => {
    try {
        const file = await getStatementFile(startDate, endDate);
        const blobUrl = window.URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Statement Download Error:", error.message);
        throw error;
    }
};

export const getStatementFile = async (startDate, endDate) => {
    try {
        let url = '/api/statements/monthly';
        const params = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        const response = await api.get(url, {
            responseType: 'blob'
        });

        const filename = startDate ? `statement_${startDate}_${endDate}.pdf` : 'monthly_statement.pdf';
        return new File([response.data], filename, { type: 'application/pdf' });
    } catch (error) {
        console.error("Failed to fetch statement file:", error.message);
        throw error;
    }
};

export const downloadTradingStatement = async () => {
    try {
        const response = await api.get('/api/statements/trading', {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'trading_statement.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Trading Statement Download Error:", error.message);
        throw error;
    }
};

export const getAuditLogs = async () => {
    try {
        const response = await api.get('/api/audit/logs');
        return response.data;
    } catch (error) {
        console.error("Audit Logs Error:", error.message);
        throw error;
    }
};

export const buyStock = async (data) => {
    try {
        const response = await api.post('/api/trade/buy', data);
        return response.data;
    } catch (error) {
        console.error("Buy Stock Error:", error.message);
        throw error;
    }
};

export const sellStock = async (data) => {
    try {
        const response = await api.post('/api/trade/sell', data);
        return response.data;
    } catch (error) {
        console.error("Sell Stock Error:", error.message);
        throw error;
    }
};

export const getPortfolio = async (accountId) => {
    try {
        const id = accountId || localStorage.getItem('accountNumber');
        const response = await api.get(`/api/portfolio?accountId=${id}`);
        return response.data;
    } catch (error) {
        console.error("Get Portfolio Error:", error.message);
        throw error;
    }
};

export const getPortfolioHistory = async (range = '12m') => {
    try {
        const response = await api.get(`/api/portfolio/history?range=${range}`);
        return response.data;
    } catch (error) {
        console.error("Get Portfolio History Error:", error.message);
        throw error;
    }
};

export const getNotifications = async (accountId) => {
    try {
        const id = accountId || localStorage.getItem('accountNumber');
        const response = await api.get(`/api/notifications?accountId=${id}`);
        return response.data;
    } catch (error) {
        console.error("Get Notifications Error:", error.message);
        throw error;
    }
};

export const markNotificationRead = async (notificationId, accountId) => {
    try {
        const id = accountId || localStorage.getItem('accountNumber');
        const response = await api.post(`/api/notifications/mark-read/${notificationId}?accountId=${id}`, {});
        return response.data;
    } catch (error) {
        console.error("Mark Notification Read Error:", error.message);
        throw error;
    }
};

export const getUnreadNotificationCount = async (accountId) => {
    try {
        const id = accountId || localStorage.getItem('accountNumber');
        const response = await api.get(`/api/notifications/unread-count?accountId=${id}`);
        return response.data.count;
    } catch (error) {
        console.error("Get Unread Count Error:", error.message);
        throw error;
    }
};

export const reverseTransaction = async (txnId) => {
    try {
        const response = await api.post(`/api/reverse/${txnId}`);
        return response.data;
    } catch (error) {
        console.error("Reverse Transaction Error:", error.message);
        throw error;
    }
};

export const getLedger = async () => {
    try {
        const response = await api.get('/api/history');
        return response.data;
    } catch (error) {
        console.error("Get Ledger Error:", error.message);
        throw error;
    }
};

export const createQuickAccount = async () => {
    try {
        const response = await api.post('/account');
        return response.data;
    } catch (error) {
        console.error("Create Quick Account Error:", error.message);
        throw error;
    }
};

export default api;
