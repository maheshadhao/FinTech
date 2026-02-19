package com.fintech.backend.controller;

import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.service.TradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/trade")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TradeController {

    @Autowired
    private TradeService tradeService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication auth, Map<String, Object> payload) {
        String accountNumber;

        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            accountNumber = auth.getName();
        } else if (payload != null && payload.containsKey("accountId")) {
            accountNumber = payload.get("accountId").toString();
            // Validate UPI PIN if provided this way
            String upiPin = payload.containsKey("upiPin") ? payload.get("upiPin").toString() : null;
            User user = userRepository.findByAccountNumber(accountNumber)
                    .orElseThrow(() -> new RuntimeException("User not found: " + payload.get("accountId")));
            if (upiPin == null || !upiPin.equals(user.getUpiPin())) {
                throw new RuntimeException("Invalid or missing UPI PIN");
            }
            return user;
        } else {
            throw new RuntimeException("Unauthorized: User not logged in and no account ID provided");
        }

        final String finalAccount = accountNumber;
        return userRepository.findByAccountNumber(finalAccount)
                .orElseThrow(() -> new RuntimeException("User not found: " + finalAccount));
    }

    private Integer parseQuantity(Object quantityObj) {
        if (quantityObj == null)
            return null;
        if (quantityObj instanceof Integer)
            return (Integer) quantityObj;
        if (quantityObj instanceof Number)
            return ((Number) quantityObj).intValue();
        try {
            return Integer.parseInt(quantityObj.toString());
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buy(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth, payload);
            String symbol = (String) payload.get("symbol");
            Integer quantity = parseQuantity(payload.get("quantity"));

            if (symbol == null || quantity == null || quantity <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid symbol or quantity"));
            }

            String typeStr = (String) payload.getOrDefault("investmentType", "SHORT_TERM");
            com.fintech.backend.model.InvestmentType type = com.fintech.backend.model.InvestmentType.valueOf(typeStr);

            Map<String, Object> result = tradeService.buy(user.getId(), symbol, quantity, type);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            int status = msg.contains("Unauthorized") || msg.contains("PIN") ? 401 : 400;
            return ResponseEntity.status(status).body(Map.of("error", msg));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/sell")
    public ResponseEntity<?> sell(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth, payload);
            String symbol = (String) payload.get("symbol");
            Integer quantity = parseQuantity(payload.get("quantity"));

            if (symbol == null || quantity == null || quantity <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid symbol or quantity"));
            }

            String typeStr = (String) payload.getOrDefault("investmentType", "SHORT_TERM");
            com.fintech.backend.model.InvestmentType type = com.fintech.backend.model.InvestmentType.valueOf(typeStr);

            Map<String, Object> result = tradeService.sell(user.getId(), symbol, quantity, type);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            int status = msg.contains("Unauthorized") || msg.contains("PIN") ? 401 : 400;
            return ResponseEntity.status(status).body(Map.of("error", msg));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
}
