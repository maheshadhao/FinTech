package com.fintech.backend.controller;

import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.service.PortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.fintech.backend.service.OpenAIService openAIService;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private User getAuthenticatedUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: User not logged in");
        }

        String accountNumber = auth.getName();
        return userRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("User not found: " + accountNumber));
    }

    @GetMapping
    public ResponseEntity<?> getPortfolio(@RequestParam(required = false) String accountId, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            return ResponseEntity.ok(portfolioService.getPortfolio(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getPortfolioHistory(@RequestParam(required = false, defaultValue = "12m") String range,
            Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            return ResponseEntity.ok(portfolioService.getPortfolioHistory(user.getId(), range));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buyStock(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);

            // Validate UPI PIN if using accountId fallback
            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
                String upiPin = payload.containsKey("upiPin") ? payload.get("upiPin").toString() : null;
                if (upiPin == null || !upiPin.equals(user.getUpiPin())) {
                    throw new RuntimeException("Invalid or missing UPI PIN");
                }
            }

            String symbol = (String) payload.get("symbol");
            int quantity = (int) payload.get("quantity");
            String typeStr = (String) payload.getOrDefault("investmentType", "SHORT_TERM");
            com.fintech.backend.model.InvestmentType type = com.fintech.backend.model.InvestmentType.valueOf(typeStr);

            return ResponseEntity.ok(portfolioService.buyStock(user.getId(), symbol, quantity, type));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sell")
    public ResponseEntity<?> sellStock(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);

            // Validate UPI PIN if using accountId fallback
            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
                String upiPin = payload.containsKey("upiPin") ? payload.get("upiPin").toString() : null;
                if (upiPin == null || !upiPin.equals(user.getUpiPin())) {
                    throw new RuntimeException("Invalid or missing UPI PIN");
                }
            }

            String symbol = (String) payload.get("symbol");
            int quantity = (int) payload.get("quantity");
            String typeStr = (String) payload.getOrDefault("investmentType", "SHORT_TERM");
            com.fintech.backend.model.InvestmentType type = com.fintech.backend.model.InvestmentType.valueOf(typeStr);

            portfolioService.sellStock(user.getId(), symbol, quantity, type);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzePortfolio(@RequestParam(required = false) String accountId, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            com.fintech.backend.model.Portfolio portfolio = portfolioService.getPortfolio(user.getId());

            String portfolioJson = objectMapper.writeValueAsString(portfolio);

            String analysis = openAIService.analyzePortfolio(portfolioJson);
            return ResponseEntity.ok(Map.of("analysis", analysis));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to analyze portfolio: " + e.getMessage()));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chatPortfolio(@RequestBody Map<String, String> payload, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            com.fintech.backend.model.Portfolio portfolio = portfolioService.getPortfolio(user.getId());
            String portfolioJson = objectMapper.writeValueAsString(portfolio);

            String userMessage = payload.get("message");
            if (userMessage == null || userMessage.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
            }

            String response = openAIService.chatWithPortfolio(portfolioJson, userMessage);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to chat with portfolio: " + e.getMessage()));
        }
    }

    @PostMapping("/audit")
    public ResponseEntity<?> auditPortfolio(@RequestParam(required = false) String accountId, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            com.fintech.backend.model.Portfolio portfolio = portfolioService.getPortfolio(user.getId());

            String portfolioJson = objectMapper.writeValueAsString(portfolio);

            String audit = openAIService.auditPortfolio(portfolioJson);
            return ResponseEntity.ok(Map.of("audit", audit));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to audit portfolio: " + e.getMessage()));
        }
    }

    @PostMapping("/outlook")
    public ResponseEntity<?> outlookPortfolio(@RequestParam(required = false) String accountId, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            com.fintech.backend.model.Portfolio portfolio = portfolioService.getPortfolio(user.getId());

            String portfolioJson = objectMapper.writeValueAsString(portfolio);

            String outlook = openAIService.predictOutlook(portfolioJson);
            return ResponseEntity.ok(Map.of("outlook", outlook));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to get portfolio outlook: " + e.getMessage()));
        }
    }
}
