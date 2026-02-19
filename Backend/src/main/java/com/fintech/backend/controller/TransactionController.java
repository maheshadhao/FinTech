package com.fintech.backend.controller;

import com.fintech.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.fintech.backend.service.TransactionService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserRepository userRepository;

    public TransactionController(TransactionService transactionService, UserRepository userRepository) {
        this.transactionService = transactionService;
        this.userRepository = userRepository;
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            Map<String, Object> result = transactionService.transfer(payload, auth);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Transfer failed: " + e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getTransactions(@RequestParam(required = false) String accountId, Authentication auth) {
        try {
            List<com.fintech.backend.model.Transaction> transactions = transactionService.getTransactions();

            if (transactions == null) {
                return ResponseEntity.ok(List.of());
            }

            // Map to response DTO to ensure all fields are present for frontend
            List<Map<String, Object>> response = transactions.stream().map(t -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", t.getId());
                map.put("transactionId", t.getId()); // Alias
                map.put("type", t.getType());
                map.put("amount", t.getAmount());
                map.put("description", t.getDescription());
                map.put("status", "COMPLETED"); // Hardcoded status as verified
                map.put("date", t.getTimestamp()); // Alias for timestamp
                map.put("timestamp", t.getTimestamp());
                map.put("senderAccount", t.getSenderAccount());
                map.put("receiverAccount", t.getReceiverAccount());
                return map;
            }).toList();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            e.printStackTrace(); // Log the runtime exception
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // Log the unexpected exception
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch transactions: " + e.getMessage()));
        }
    }

    @GetMapping("/search-user")
    public ResponseEntity<?> searchUser(@RequestParam String query) {
        // Keeping search in controller for now as it's a simple query
        return ResponseEntity.ok(List.of()); // Mocked or logic remains here
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody Map<String, Object> request) {
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            return ResponseEntity.ok(transactionService.deposit(amount));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Deposit failed: " + e.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody Map<String, Object> request) {
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            return ResponseEntity.ok(transactionService.withdraw(amount));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Withdrawal failed: " + e.getMessage()));
        }
    }

    @GetMapping("/debug/users")
    public ResponseEntity<?> listAllUsers() {
        List<Map<String, String>> users = userRepository.findAll().stream()
                .map(user -> Map.of(
                        "accountNumber", user.getAccountNumber(),
                        "role", user.getRole() != null ? user.getRole() : "NULL",
                        "email", user.getEmail() != null ? user.getEmail() : "NULL"))
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/reverse/{txnId}")
    public ResponseEntity<?> reverseTransaction(@PathVariable Long txnId) {
        try {
            Map<String, Object> result = transactionService.reverseTransaction(txnId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Reversal failed: " + e.getMessage()));
        }
    }
}
