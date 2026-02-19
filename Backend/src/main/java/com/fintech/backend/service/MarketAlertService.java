package com.fintech.backend.service;

import com.fintech.backend.model.MarketAlert;
import com.fintech.backend.model.Stock;
import com.fintech.backend.model.User;
import com.fintech.backend.repository.MarketAlertRepository;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MarketAlertService {

    @Autowired
    private MarketAlertRepository marketAlertRepository;

    @Autowired
    private StockDataService stockDataService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StockRepository stockRepository;

    public MarketAlert createAlert(MarketAlert alert) {
        alert.setCreatedAt(LocalDateTime.now());
        alert.setTriggered(false);
        return marketAlertRepository.save(alert);
    }

    public List<MarketAlert> getActiveAlerts(Long userId) {
        return marketAlertRepository.findByUserId(userId);
    }

    public void checkAlerts() {
        // This could be scheduled to run every minute
        List<MarketAlert> activeAlerts = marketAlertRepository.findByIsTriggeredFalse();

        for (MarketAlert alert : activeAlerts) {
            Stock stock = stockDataService.getStock(alert.getStockSymbol());
            boolean triggered = false;

            if (alert.getCondition() == MarketAlert.AlertCondition.ABOVE) {
                if (stock.getCurrentPrice().compareTo(alert.getTargetPrice()) > 0) {
                    triggered = true;
                }
            } else {
                if (stock.getCurrentPrice().compareTo(alert.getTargetPrice()) < 0) {
                    triggered = true;
                }
            }

            if (triggered) {
                alert.setTriggered(true);
                marketAlertRepository.save(alert);

                // Send Email Notification
                User user = alert.getUser();
                if (user != null && user.getEmail() != null) {
                    emailService.sendMarketAlert(
                            user.getEmail(),
                            alert.getStockSymbol(),
                            stock.getCurrentPrice(),
                            alert.getCondition().toString());
                }

                System.out.println("ALERT TRIGGERED: " + alert.getStockSymbol() + " is " + alert.getCondition() + " "
                        + alert.getTargetPrice());
            }
        }
    }

    public void checkMarketHighs() {
        // Define "High" as > 5% gain
        BigDecimal gainThreshold = new BigDecimal("5.0");
        List<Stock> stocks = stockRepository.findAll();

        for (Stock stock : stocks) {
            if (stock.getChangePercent() != null && stock.getChangePercent().compareTo(gainThreshold) > 0) {
                // For "Market High", we notify all users for this demo.
                List<User> users = userRepository.findAll();
                for (User user : users) {
                    if (user.getEmail() != null) {
                        emailService.sendMarketHighAlert(
                                user.getEmail(),
                                stock.getSymbol(),
                                stock.getCurrentPrice(),
                                stock.getChangePercent());
                    }
                }
                System.out.println(
                        "MARKET HIGH DETECTED: " + stock.getSymbol() + " is up " + stock.getChangePercent() + "%");
            }
        }
    }
}
