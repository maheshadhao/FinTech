package com.fintech.backend.service;

import com.fintech.backend.annotation.Audited;
import com.fintech.backend.model.*;
import com.fintech.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class PortfolioService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StockDataService stockDataService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TradeRepository tradeRepository;

    public Portfolio getPortfolio(Long userId) {
        return portfolioRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyPortfolio(userId));
    }

    private Portfolio createEmptyPortfolio(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Portfolio portfolio = new Portfolio();
        portfolio.setUser(user);
        return portfolioRepository.save(portfolio);
    }

    public java.util.List<java.util.Map<String, Object>> getPortfolioHistory(Long userId, String range) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        String accountNumber = user.getAccountNumber();

        // Calculate start date based on range
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime startDate = now.minusMonths(12); // Default
        if ("7d".equals(range))
            startDate = now.minusDays(7);
        else if ("30d".equals(range))
            startDate = now.minusDays(30);

        // Fetch all history sorted ASC (by retrieving DESC and reversing)
        java.util.List<Transaction> transactions = transactionRepository
                .findBySenderAccountOrReceiverAccountOrderByTimestampDesc(accountNumber, accountNumber);
        java.util.Collections.reverse(transactions);

        java.util.List<Trade> trades = tradeRepository.findByUserId(userId);
        trades.sort(java.util.Comparator.comparing(Trade::getTimestamp));

        // Merge events
        java.util.List<Event> events = new java.util.ArrayList<>();
        for (Transaction t : transactions)
            events.add(new Event(t.getTimestamp(), "TRANSACTION", t));
        for (Trade t : trades)
            events.add(new Event(t.getTimestamp(), "TRADE", t));

        events.sort(java.util.Comparator.comparing(Event::getTimestamp));

        // State tracking
        double currentCash = 0;
        java.util.Map<String, Integer> holdings = new java.util.HashMap<>();
        java.util.Map<String, Double> lastPrices = new java.util.HashMap<>();

        java.util.List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();

        // Iterate
        java.time.LocalDate lastDate = null;

        for (Event e : events) {
            // Update state
            if ("TRANSACTION".equals(e.type)) {
                Transaction txn = (Transaction) e.data;
                if (txn.getReceiverAccount().equals(accountNumber)) {
                    currentCash += txn.getAmount().doubleValue();
                }
                if (txn.getSenderAccount().equals(accountNumber)) {
                    currentCash -= txn.getAmount().doubleValue();
                }
            } else if ("TRADE".equals(e.type)) {
                Trade tr = (Trade) e.data;
                if (tr.getType() == Trade.TradeType.BUY) {
                    currentCash -= tr.getTotalCost().doubleValue();
                    holdings.put(tr.getSymbol(), holdings.getOrDefault(tr.getSymbol(), 0) + tr.getQuantity());
                    lastPrices.put(tr.getSymbol(), tr.getPrice().doubleValue());
                } else {
                    // SELL logic: Recalculate cash based on sell price
                    // Usually sell adds cash = quantity * price
                    // Trade model has totalCost which for SELL is proceeds
                    currentCash += tr.getTotalCost().doubleValue();
                    holdings.put(tr.getSymbol(), holdings.getOrDefault(tr.getSymbol(), 0) - tr.getQuantity());
                    lastPrices.put(tr.getSymbol(), tr.getPrice().doubleValue());
                }
            }

            // Record snapshot if date changed and is within range
            if (e.timestamp.isAfter(startDate)) {
                java.time.LocalDate currDate = e.timestamp.toLocalDate();
                if (lastDate == null || !currDate.equals(lastDate)) {
                    // Calculate Total Value
                    double stockValue = 0;
                    for (String symbol : holdings.keySet()) {
                        int qty = holdings.get(symbol);
                        double price = lastPrices.getOrDefault(symbol, 0.0);
                        stockValue += qty * price;
                    }

                    java.util.Map<String, Object> point = new java.util.HashMap<>();
                    point.put("date", currDate.toString());
                    point.put("value", currentCash + stockValue);
                    history.add(point);
                    lastDate = currDate;
                }
            }
        }

        // Add final point if today is missing
        java.util.Map<String, Object> finalPoint = new java.util.HashMap<>();
        finalPoint.put("date", now.toLocalDate().toString());
        // Calculate final Total Value
        double finalStockValue = 0;
        for (String symbol : holdings.keySet()) {
            int qty = holdings.get(symbol);
            double price = lastPrices.getOrDefault(symbol, 0.0);
            finalStockValue += qty * price;
        }
        finalPoint.put("value", currentCash + finalStockValue);

        // Avoid duplicate "today"
        if (!history.isEmpty()) {
            String lastHistoryDate = (String) history.get(history.size() - 1).get("date");
            if (!lastHistoryDate.equals(now.toLocalDate().toString())) {
                history.add(finalPoint);
            } else {
                // Update the last point to be most accurate
                history.set(history.size() - 1, finalPoint);
            }
        } else {
            history.add(finalPoint);
        }

        return history;
    }

    private static class Event {
        java.time.LocalDateTime timestamp;
        String type;
        Object data;

        public Event(java.time.LocalDateTime timestamp, String type, Object data) {
            this.timestamp = timestamp;
            this.type = type;
            this.data = data;
        }

        public java.time.LocalDateTime getTimestamp() {
            return timestamp;
        }
    }

    @Transactional
    @Audited
    public Holding buyStock(Long userId, String symbol, int quantity, InvestmentType investmentType) {
        String upperSymbol = symbol.toUpperCase();
        Stock stock = stockDataService.refreshStock(upperSymbol); // Get latest price
        Portfolio portfolio = getPortfolio(userId);

        // In a real app, check user balance here

        Optional<Holding> existingHolding = portfolio.getHoldings().stream()
                .filter(h -> h.getStockSymbol().equalsIgnoreCase(upperSymbol)
                        && h.getInvestmentType() == investmentType)
                .findFirst();

        Holding holding;
        if (existingHolding.isPresent()) {
            holding = existingHolding.get();
            // Recalculate average price
            BigDecimal totalValue = holding.getAverageBuyPrice().multiply(new BigDecimal(holding.getQuantity()))
                    .add(stock.getCurrentPrice().multiply(new BigDecimal(quantity)));
            int newQuantity = holding.getQuantity() + quantity;
            holding.setAverageBuyPrice(
                    totalValue.divide(new BigDecimal(newQuantity), 4, java.math.RoundingMode.HALF_UP));
            holding.setQuantity(newQuantity);
        } else {
            holding = new Holding();
            holding.setPortfolio(portfolio);
            holding.setStockSymbol(upperSymbol);
            holding.setQuantity(quantity);
            holding.setAverageBuyPrice(stock.getCurrentPrice());
            holding.setInvestmentType(investmentType);
            holding.setPurchaseDate(java.time.LocalDateTime.now());
            portfolio.getHoldings().add(holding);
        }

        // Record Trade
        Trade trade = Trade.builder()
                .userId(userId)
                .symbol(upperSymbol)
                .type(Trade.TradeType.BUY)
                .quantity(quantity)
                .price(stock.getCurrentPrice())
                .totalCost(stock.getCurrentPrice().multiply(new BigDecimal(quantity)))
                .investmentType(investmentType)
                .timestamp(java.time.LocalDateTime.now())
                .build();
        tradeRepository.save(trade); // 🔥 SAVE TRADE

        return holdingRepository.save(holding);
    }

    @Transactional
    @Audited
    public Holding sellStock(Long userId, String symbol, int quantity, InvestmentType investmentType) {
        String upperSymbol = symbol.toUpperCase();
        Portfolio portfolio = getPortfolio(userId);

        Holding holding = portfolio.getHoldings().stream()
                .filter(h -> h.getStockSymbol().equalsIgnoreCase(upperSymbol)
                        && h.getInvestmentType() == investmentType)
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Holding not found for symbol: " + upperSymbol + " (" + investmentType + ")"));

        if (holding.getQuantity() < quantity) {
            throw new RuntimeException("Not enough shares to sell");
        }

        // Record Trade (Use current price? Or average price? Usually current market
        // price)
        // We need current price to record the 'Sell' value
        Stock stock = stockDataService.refreshStock(upperSymbol);

        Trade trade = Trade.builder()
                .userId(userId)
                .symbol(upperSymbol)
                .type(Trade.TradeType.SELL)
                .quantity(quantity)
                .price(stock.getCurrentPrice())
                .totalCost(stock.getCurrentPrice().multiply(new BigDecimal(quantity)))
                .investmentType(investmentType)
                .timestamp(java.time.LocalDateTime.now())
                .build();
        tradeRepository.save(trade); // 🔥 SAVE TRADE

        holding.setQuantity(holding.getQuantity() - quantity);

        if (holding.getQuantity() == 0) {
            portfolio.getHoldings().remove(holding);
            holdingRepository.delete(holding);
            return null;
        }

        return holdingRepository.save(holding);
    }
}
