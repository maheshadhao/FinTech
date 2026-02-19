package com.fintech.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AlertScheduler {

    @Autowired
    private MarketAlertService marketAlertService;

    @Autowired
    private StockDataService stockDataService;

    // Run every minute to check for price alerts
    @Scheduled(fixedRate = 60000)
    public void processMarketAlerts() {
        System.out.println("SCHEDULER >>> Refreshing stock prices and checking alerts...");
        stockDataService.refreshAllStocks();
        marketAlertService.checkAlerts();
    }

    // Run every 5 minutes to check for market high (surging) stocks
    @Scheduled(fixedRate = 300000)
    public void processMarketHighs() {
        System.out.println("SCHEDULER >>> Checking for market highs...");
        marketAlertService.checkMarketHighs();
    }
}
