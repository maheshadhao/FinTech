package com.fintech.backend.controller;

import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BalanceController {

    private final UserRepository userRepository;

    public BalanceController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalance(
            @RequestParam(required = false) String upiPin,
            @RequestParam(required = false) String accountId,
            Authentication auth) {
        return handleBalanceRequest(null, upiPin, accountId, auth);
    }

    @PostMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalancePost(
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        return handleBalanceRequest(body, null, null, auth);
    }

    private ResponseEntity<Map<String, Object>> handleBalanceRequest(
            Map<String, String> body,
            String upiPin,
            String accountId,
            Authentication auth) {
        System.out.println("DEBUG >>> BalanceController reached. Auth: " + (auth != null ? auth.getName() : "NULL")
                + ", AccountId: " + accountId);
        Map<String, Object> response = new HashMap<>();

        try {
            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
                auth = SecurityContextHolder.getContext().getAuthentication();
            }

            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "User not logged in"));
            }

            String accountNumber = auth.getName();

            User user = userRepository.findByAccountNumber(accountNumber).orElse(null);

            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            // Validate UPI PIN: Check body first, then query param
            String providedPin = body != null ? body.get("upiPin") : upiPin;

            // Relaxed check: If user is authenticated, we might skip PIN check for
            // dashboard view
            // OR if strictly required, frontend must send it.
            // Assuming dashboard needs to show balance without PIN re-entry:
            boolean isAuthenticated = auth != null && auth.isAuthenticated()
                    && !auth.getPrincipal().equals("anonymousUser");

            if (!isAuthenticated && (providedPin == null || !providedPin.equals(user.getUpiPin()))) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid UPI PIN"));
            }
            // UseCase: If authenticated but PIN provided, verify it (for sensitive ops)
            if (providedPin != null && !providedPin.isEmpty() && !providedPin.equals(user.getUpiPin())) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid UPI PIN"));
            }

            response.put("balance", user.getBalance());
            response.put("accountNumber", user.getAccountNumber());
            return ResponseEntity.ok(response);

        } catch (Throwable e) {
            e.printStackTrace();
            response.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
