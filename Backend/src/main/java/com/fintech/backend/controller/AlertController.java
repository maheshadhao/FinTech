package com.fintech.backend.controller;

import com.fintech.backend.model.MarketAlert;
import com.fintech.backend.service.MarketAlertService;
import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private MarketAlertService marketAlertService;

    @Autowired
    private UserRepository userRepository;

    private Long getUserId() {
        return 1L; // Mock ID
    }

    @GetMapping
    public List<MarketAlert> getAlerts() {
        return marketAlertService.getActiveAlerts(getUserId());
    }

    @PostMapping
    public MarketAlert createAlert(@RequestBody MarketAlert alert) {
        // Determine user
        User user = userRepository.findById(getUserId()).orElseThrow();
        alert.setUser(user);
        return marketAlertService.createAlert(alert);
    }
}
