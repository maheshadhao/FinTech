package com.fintech.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.service.AuthService;
import jakarta.servlet.http.HttpSession;

import java.util.HashMap;
import java.util.Map;

@RestController
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @GetMapping("/loggedin_user")
    public ResponseEntity<Map<String, Object>> getLoggedInUser(Authentication authentication, HttpSession session) {
        try {
            if (authentication == null || !authentication.isAuthenticated()
                    || authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.ok(Map.of("status", "error", "message", "User not logged in"));
            }

            String accountNumber = authentication.getName();
            User user = userRepository.findByAccountNumber(accountNumber).orElse(null);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("status", "error", "message", "User not found"));
            }

            // Store role in session for admin access control
            if (user.getRole() != null) {
                session.setAttribute("role", user.getRole());
            } else {
                session.setAttribute("role", "USER");
            }
            session.setAttribute("accountNumber", user.getAccountNumber());

            Map<String, Object> userData = new HashMap<>();
            userData.put("accountNumber", user.getAccountNumber());
            userData.put("username", user.getAccountNumber());
            userData.put("name", user.getName());
            userData.put("balance", user.getBalance());
            userData.put("phoneNumber", user.getPhoneNumber());
            userData.put("role", user.getRole() != null ? user.getRole() : "USER");

            return ResponseEntity.ok(Map.of("status", "success", "data", userData));
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("ERROR in getLoggedInUser: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("status", "error", "message", "Internal server error: " + e.getMessage()));
        }
    }

    @PostMapping("/createAccount")
    public ResponseEntity<Map<String, Object>> createAccount(@RequestBody Map<String, Object> request) {
        try {
            return ResponseEntity.ok(authService.createAccount(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Account creation failed"));
        }
    }
}
