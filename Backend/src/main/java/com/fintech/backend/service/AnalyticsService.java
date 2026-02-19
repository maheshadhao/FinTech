package com.fintech.backend.service;

import com.fintech.backend.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private StockDataService stockDataService;

    @Autowired
    private com.fintech.backend.repository.TransactionRepository transactionRepository;

    @Autowired
    private com.fintech.backend.repository.TradeRepository tradeRepository;

    @Autowired
    private com.fintech.backend.repository.UserRepository userRepository;

    public Map<String, Object> getPortfolioPerformance(Long userId) {
        Portfolio portfolio = portfolioService.getPortfolio(userId);
        List<Holding> holdings = portfolio.getHoldings();

        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal currentValue = BigDecimal.ZERO;

        for (Holding holding : holdings) {
            // refresh data to get real-time price
            Stock stock = stockDataService.refreshStock(holding.getStockSymbol());

            BigDecimal invested = holding.getAverageBuyPrice().multiply(new BigDecimal(holding.getQuantity()));
            BigDecimal current = stock.getCurrentPrice().multiply(new BigDecimal(holding.getQuantity()));

            totalInvested = totalInvested.add(invested);
            currentValue = currentValue.add(current);
        }

        BigDecimal profitLoss = currentValue.subtract(totalInvested);
        double profitLossPercentage = 0;
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            profitLossPercentage = profitLoss.divide(totalInvested, 4, java.math.RoundingMode.HALF_UP).doubleValue()
                    * 100;
        }

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalInvested", totalInvested);
        metrics.put("currentValue", currentValue);
        metrics.put("profitLoss", profitLoss);
        metrics.put("profitLossPercentage", profitLossPercentage);

        return metrics;
    }

    public Map<String, Object> getMonthlyAnalytics(Long userId, int month, int year) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end = start.plusMonths(1).minusNanos(1);

        // Fetch Transactions
        List<Transaction> transactions = transactionRepository
                .findBySenderAccountOrReceiverAccountAndTimestampBetween(user.getAccountNumber(),
                        user.getAccountNumber(),
                        start, end);

        // Fetch Trades
        List<Trade> trades = tradeRepository.findByUserIdAndTimestampBetween(userId, start, end);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        // Calculate from Transactions
        for (Transaction t : transactions) {
            boolean isIncoming = t.getReceiverAccount().equals(user.getAccountNumber());
            if (isIncoming) {
                if ("TRANSFER".equals(t.getType()) || "DEPOSIT".equals(t.getType())) {
                    totalIncome = totalIncome.add(t.getAmount());
                }
            } else {
                if ("TRANSFER".equals(t.getType()) || "WITHDRAW".equals(t.getType())) {
                    totalExpense = totalExpense.add(t.getAmount());
                }
            }
        }

        // Calculate from Trades
        for (Trade t : trades) {
            if (t.getType() == Trade.TradeType.SELL) {
                totalIncome = totalIncome.add(t.getTotalCost());
            } else if (t.getType() == Trade.TradeType.BUY) {
                totalExpense = totalExpense.add(t.getTotalCost());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalIncome", totalIncome);
        response.put("totalExpense", totalExpense);
        response.put("month", month);
        response.put("year", year);
        return response;
    }

    public List<Map<String, Object>> getLongTermHoldings(Long userId) {
        Portfolio portfolio = portfolioService.getPortfolio(userId);
        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);

        return portfolio.getHoldings().stream()
                .filter(h -> h.getInvestmentType() == InvestmentType.LONG_TERM)
                .map(h -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("symbol", h.getStockSymbol());
                    data.put("quantity", h.getQuantity());
                    data.put("purchaseDate", h.getPurchaseDate());

                    long daysHeld = 0;
                    if (h.getPurchaseDate() != null) {
                        daysHeld = ChronoUnit.DAYS.between(h.getPurchaseDate(), LocalDateTime.now());
                    }
                    data.put("daysHeld", daysHeld);

                    data.put("isLongTermQualified",
                            h.getPurchaseDate() != null && h.getPurchaseDate().isBefore(oneYearAgo)); // Tax implication
                                                                                                      // logic
                    return data;
                })
                .collect(Collectors.toList());
    }
}
