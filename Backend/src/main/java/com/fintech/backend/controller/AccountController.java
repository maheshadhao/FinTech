package com.fintech.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/account")
public class AccountController {

    private final com.fintech.backend.service.AuthService authService;

    public AccountController(com.fintech.backend.service.AuthService authService) {
        this.authService = authService;
    }

    @org.springframework.web.bind.annotation.PostMapping("/update-pin")
    public org.springframework.http.ResponseEntity<?> updateUpiPin(
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> request,
            org.springframework.security.core.Authentication auth) {
        try {
            if (auth == null || !auth.isAuthenticated()) {
                return org.springframework.http.ResponseEntity.status(401)
                        .body(java.util.Map.of("error", "Unauthorized"));
            }

            String accountNumber = auth.getName();
            String oldPin = request.get("oldPin");
            String newPin = request.get("newPin");

            if (oldPin == null || newPin == null) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("error", "Missing required fields"));
            }

            authService.updateUpiPin(accountNumber, oldPin, newPin);

            return org.springframework.http.ResponseEntity
                    .ok(java.util.Map.of("message", "UPI PIN updated successfully"));
        } catch (RuntimeException e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(java.util.Map.of("error", "Internal server error"));
        }
    }

    @org.springframework.web.bind.annotation.PostMapping
    public org.springframework.http.ResponseEntity<?> createAccount(
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> request) {
        try {
            java.util.Map<String, Object> result = authService.createAccount(request);
            return org.springframework.http.ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(java.util.Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
}
