package com.fintech.backend.controller;

import com.fintech.backend.model.Stock;
import com.fintech.backend.service.StockDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend access
public class StockController {

    @Autowired
    private StockDataService stockDataService;

    @GetMapping("/{symbol}")
    public Stock getStock(@PathVariable String symbol) {
        return stockDataService.refreshStock(symbol);
    }

    @GetMapping("/{symbol}/history")
    public Map<String, Object> getStockHistory(@PathVariable String symbol,
            @RequestParam(defaultValue = "7d") String period) {
        return stockDataService.getHistory(symbol, period);
    }
}
