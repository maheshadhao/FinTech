import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import api from './api';
// Create a new instance of the mock adapter on the default axios instance
// onNoMatch: "passthrough" allows other requests (like login) to go to the real server
const mock = new MockAdapter(axios, { delayResponse: 0, onNoMatch: "passthrough" });
const apiMock = new MockAdapter(api, { delayResponse: 0, onNoMatch: "passthrough" });

const INITIAL_STOCKS = [
    { symbol: 'AAPL', quantity: 10, buyPrice: 150.00, currentPrice: 155.00 },
    { symbol: 'GOOGL', quantity: 5, buyPrice: 2800.00, currentPrice: 2750.00 },
    { symbol: 'TSLA', quantity: 8, buyPrice: 900.00, currentPrice: 920.00 },
    { symbol: 'AMZN', quantity: 15, buyPrice: 3300.00, currentPrice: 3350.00 },
    { symbol: 'MSFT', quantity: 12, buyPrice: 290.00, currentPrice: 305.00 },
];

/**
 * Configure the mock adapter to intercept GET requests to http://localhost:3000/stocks
 */
export const setupStockMock = () => {
    const applyRules = (m) => {
        m.onGet('http://localhost:3000/stocks').reply(async (config) => {
            // Simulate random latency between 100ms and 500ms
            const latency = Math.floor(Math.random() * 400) + 100;

            await new Promise(resolve => setTimeout(resolve, latency));

            // Fluctuate prices slightly
            const updatedStocks = INITIAL_STOCKS.map(stock => {
                const changePercent = (Math.random() * 0.02) - 0.01; // -1% to +1%
                const newPrice = stock.currentPrice * (1 + changePercent);
                return {
                    ...stock,
                    currentPrice: parseFloat(newPrice.toFixed(2))
                };
            });

            // Return legacy 200 OK and data
            return [200, updatedStocks];
        });

        // Portfolio History Mock
        m.onGet('/api/portfolio/history').reply(200, [
            { "date": "2026-01-01", "value": 50000 },
            { "date": "2026-02-01", "value": 54000 },
            { "date": "2026-03-01", "value": 56000 },
            { "date": "2026-04-01", "value": 59000 }
        ]);

        // Also handle full URL just in case
        m.onGet('http://localhost:8080/api/portfolio/history').reply(200, [
            { "date": "2026-01-01", "value": 50000 },
            { "date": "2026-02-01", "value": 54000 },
            { "date": "2026-03-01", "value": 56000 },
            { "date": "2026-04-01", "value": 59000 }
        ]);

        // Trading Statement Mock - Returns a simple text file content
        m.onGet('/api/statements/trading').reply(async () => {
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay to show loading
            return [200, "Trading Statement\n\nDate: 2026-02-09\n\nHoldings:\n- AAPL: 10 units\n- GOOGL: 5 units\n- TSLA: 8 units\n\nTotal Value: $59,000"];
        });
    };

    applyRules(mock);
    applyRules(apiMock);

    console.log('Mock Stock API initialized');
};
