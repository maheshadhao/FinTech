package com.fintech.backend.service;

import com.fintech.backend.annotation.Audited;
import com.fintech.backend.model.*;
import com.fintech.backend.repository.TradeRepository;
import com.fintech.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class TradeService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private StockDataService stockDataService;

    @Autowired
    private EmailService emailService;

    @Transactional
    @Audited
    public Map<String, Object> buy(Long userId, String symbol, Integer quantity, InvestmentType investmentType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Stock stock = stockDataService.refreshStock(symbol);
        BigDecimal price = stock.getCurrentPrice();
        BigDecimal totalCost = price.multiply(BigDecimal.valueOf(quantity));

        if (user.getBalance().compareTo(totalCost) < 0) {
            throw new RuntimeException(
                    "Insufficient balance. Required: " + totalCost + ", Available: " + user.getBalance());
        }

        // Deduct balance
        user.setBalance(user.getBalance().subtract(totalCost));
        userRepository.save(user);

        // Update Portfolio Holdings
        portfolioService.buyStock(userId, symbol, quantity, investmentType);

        // Record Trade History
        Trade trade = Trade.builder()
                .userId(userId)
                .symbol(symbol)
                .type(Trade.TradeType.BUY)
                .quantity(quantity)
                .price(price)
                .totalCost(totalCost)
                .investmentType(investmentType)
                .timestamp(LocalDateTime.now())
                .build();
        tradeRepository.save(trade);

        // Send trade alert email
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            emailService.sendTradeAlert(user.getEmail(), "BUY", symbol, quantity, price, totalCost);
        }

        return createResponse("BUY", symbol, quantity, price, totalCost, user.getBalance());
    }

    @Transactional
    @Audited
    public Map<String, Object> sell(Long userId, String symbol, Integer quantity, InvestmentType investmentType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Stock stock = stockDataService.refreshStock(symbol);
        BigDecimal price = stock.getCurrentPrice();
        BigDecimal totalEarned = price.multiply(BigDecimal.valueOf(quantity));

        // Check if user has enough shares (PortfolioService handles the holding check)
        portfolioService.sellStock(userId, symbol, quantity, investmentType);

        // Add to balance
        user.setBalance(user.getBalance().add(totalEarned));
        userRepository.save(user);

        // Record Trade History
        Trade trade = Trade.builder()
                .userId(userId)
                .symbol(symbol)
                .type(Trade.TradeType.SELL)
                .quantity(quantity)
                .price(price)
                .totalCost(totalEarned)
                .investmentType(investmentType)
                .timestamp(LocalDateTime.now())
                .build();
        tradeRepository.save(trade);

        // Send trade alert email
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            emailService.sendTradeAlert(user.getEmail(), "SELL", symbol, quantity, price, totalEarned);
        }

        return createResponse("SELL", symbol, quantity, price, totalEarned, user.getBalance());
    }

    private Map<String, Object> createResponse(String action, String symbol, Integer quantity, BigDecimal price,
            BigDecimal total, BigDecimal newBalance) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("action", action);
        response.put("symbol", symbol);
        response.put("quantity", quantity);
        response.put("price", price);
        response.put("totalValue", total);
        response.put("newBalance", newBalance);
        response.put("message", "Successfully " + action.toLowerCase() + " " + quantity + " shares of " + symbol);
        return response;
    }

    // Legacy method overload for backward compatibility (defaults to SHORT_TERM)
    public Map<String, Object> buy(Long userId, String symbol, Integer quantity) {
        return buy(userId, symbol, quantity, InvestmentType.SHORT_TERM);
    }

    public Map<String, Object> sell(Long userId, String symbol, Integer quantity) {
        return sell(userId, symbol, quantity, InvestmentType.SHORT_TERM);
    }

    public Map<String, Object> executeTrade(String accountNumber, String symbol, String action, Integer quantity,
            BigDecimal price) {
        User user = userRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("BUY".equalsIgnoreCase(action)) {
            return buy(user.getId(), symbol, quantity, InvestmentType.SHORT_TERM);
        } else if ("SELL".equalsIgnoreCase(action)) {
            return sell(user.getId(), symbol, quantity, InvestmentType.SHORT_TERM);
        } else {
            throw new RuntimeException("Invalid trade action: " + action);
        }
    }
}
