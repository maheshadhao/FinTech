package com.fintech.backend.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class StockService {
    private final Map<String, BigDecimal> mockPrices = new HashMap<>();
    private final Random random = new Random();

    public StockService() {
        mockPrices.put("AAPL", new BigDecimal("185.92"));
        mockPrices.put("GOOGL", new BigDecimal("142.71"));
        mockPrices.put("MSFT", new BigDecimal("398.67"));
        mockPrices.put("TSLA", new BigDecimal("193.57"));
        mockPrices.put("AMZN", new BigDecimal("174.45"));
    }

    public BigDecimal getPrice(String symbol) {
        String sym = symbol.toUpperCase();
        if (mockPrices.containsKey(sym)) {
            // Add a small random fluctuation
            BigDecimal base = mockPrices.get(sym);
            double fluctuation = (random.nextDouble() - 0.5) * 5.0; // +/- $2.5
            return base.add(BigDecimal.valueOf(fluctuation)).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return null;
    }

    public Map<String, BigDecimal> getMarketOverview() {
        return mockPrices;
    }
}
