package com.fintech.backend.controller;

import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication auth, String accountId) {
        String accountNumber = null;
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            accountNumber = auth.getName();
        } else if (accountId != null) {
            accountNumber = accountId;
        }

        if (accountNumber == null) {
            throw new RuntimeException("Unauthorized: User not logged in and no account ID provided");
        }

        final String finalAccountNumber = accountNumber;
        return userRepository.findByAccountNumber(finalAccountNumber)
                .orElseThrow(() -> new RuntimeException("User not found: " + finalAccountNumber));
    }

    @GetMapping("/portfolio")
    public ResponseEntity<?> getPortfolioPerformance(@RequestParam(required = false) String accountId,
            Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth, accountId);
            return ResponseEntity.ok(analyticsService.getPortfolioPerformance(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/long-term")
    public ResponseEntity<?> getLongTermHoldings(@RequestParam(required = false) String accountId,
            Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth, accountId);
            return ResponseEntity.ok(analyticsService.getLongTermHoldings(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyAnalytics(
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth, accountId);
            int currentMonth = (month != null) ? month : java.time.LocalDate.now().getMonthValue();
            int currentYear = (year != null) ? year : java.time.LocalDate.now().getYear();

            return ResponseEntity.ok(analyticsService.getMonthlyAnalytics(user.getId(), currentMonth, currentYear));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }
}
