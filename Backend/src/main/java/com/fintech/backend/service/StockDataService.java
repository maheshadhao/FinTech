package com.fintech.backend.service;

import com.fintech.backend.model.Stock;
import com.fintech.backend.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class StockDataService {

    @Autowired
    private StockRepository stockRepository;

    private static final Map<String, BigDecimal> INITIAL_PRICES = new HashMap<>();

    static {
        INITIAL_PRICES.put("AAPL", new BigDecimal("150.00"));
        INITIAL_PRICES.put("GOOGL", new BigDecimal("2800.00"));
        INITIAL_PRICES.put("AMZN", new BigDecimal("3400.00"));
        INITIAL_PRICES.put("MSFT", new BigDecimal("300.00"));
        INITIAL_PRICES.put("TSLA", new BigDecimal("700.00"));
    }

    public Stock getStock(String symbol) {
        return stockRepository.findById(symbol).orElseGet(() -> createMockStock(symbol));
    }

    private Stock createMockStock(String symbol) {
        Stock stock = new Stock();
        stock.setSymbol(symbol);
        stock.setCompanyName(symbol + " Corp"); // Simplified mock name

        BigDecimal basePrice = INITIAL_PRICES.getOrDefault(symbol, new BigDecimal("100.00"));
        stock.setCurrentPrice(basePrice);
        stock.setChangeAmount(BigDecimal.ZERO);
        stock.setChangePercent(BigDecimal.ZERO);
        stock.setLastUpdated(LocalDateTime.now());

        return stockRepository.save(stock);
    }

    public Stock refreshStock(String symbol) {
        Stock stock = getStock(symbol);
        // Simulate price change
        double changeFactor = 0.99 + (Math.random() * 0.02); // +/- 1%
        BigDecimal oldPrice = stock.getCurrentPrice();
        BigDecimal newPrice = oldPrice.multiply(new BigDecimal(changeFactor));

        stock.setCurrentPrice(newPrice);
        stock.setChangeAmount(newPrice.subtract(oldPrice));
        if (oldPrice.compareTo(BigDecimal.ZERO) != 0) {
            stock.setChangePercent(stock.getChangeAmount().divide(oldPrice, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100)));
        } else {
            stock.setChangePercent(BigDecimal.ZERO);
        }
        stock.setLastUpdated(LocalDateTime.now());

        return stockRepository.save(stock);
    }

    public void refreshAllStocks() {
        INITIAL_PRICES.keySet().forEach(this::refreshStock);
    }

    public Map<String, Object> getHistory(String symbol, String period) {
        // Mock history data
        Map<String, Object> history = new HashMap<>();
        history.put("symbol", symbol);
        history.put("period", period);

        List<Map<String, Object>> dataPoints = new ArrayList<>();
        int days = switch (period) {
            case "7d" -> 7;
            case "30d" -> 30;
            case "12m" -> 365;
            default -> 7;
        };

        BigDecimal price = INITIAL_PRICES.getOrDefault(symbol, new BigDecimal("100.00"));
        LocalDateTime date = LocalDateTime.now().minusDays(days);

        for (int i = 0; i < days; i++) {
            Map<String, Object> point = new HashMap<>();
            double changeFactor = 0.98 + (Math.random() * 0.04);
            price = price.multiply(new BigDecimal(changeFactor));

            point.put("date", date.plusDays(i).toString());
            point.put("price", price);
            dataPoints.add(point);
        }
        history.put("data", dataPoints);
        return history;
    }
}
