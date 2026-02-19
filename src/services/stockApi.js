import axios from "axios";

// START: Configuration
// ⚠️ Replace this URL with your actual API provider's URL if known (e.g. https://www.alphavantage.co/query)
// Currently pointing to localhost for testing with mock server
const API_URL = "http://localhost:3000/stocks";

const API_KEY = "8505XI7FQZ98F21Q";
// END: Configuration

export const fetchStocks = async () => {
    const start = performance.now();

    try {
        // Sending key as query param (common format) and header (just in case)
        const response = await axios.get(API_URL, {
            params: {
                apikey: API_KEY,     // Alpha Vantage / General format
                access_key: API_KEY  // Backup format
            }
        });

        const end = performance.now();
        const latency = end - start;
        console.log(`API Latency: ${latency.toFixed(2)} ms`);

        if (latency > 300) {
            console.warn("⚠ API latency exceeded 300ms");
        }

        return response.data;
    } catch (error) {
        console.error("API Call Failed:", error);
        throw error;
    }
};
