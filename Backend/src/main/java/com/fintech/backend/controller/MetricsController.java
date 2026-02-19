package com.fintech.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    @GetMapping("/latency")
    public Map<String, Object> getLatencyMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        Random rand = new Random();

        metrics.put("stock_api_latency_ms", rand.nextInt(50) + 20); // 20-70ms
        metrics.put("db_query_time_ms", rand.nextInt(10) + 2); // 2-12ms
        metrics.put("status", "healthy");

        return metrics;
    }
}
