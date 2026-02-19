package com.fintech.backend.controller;

import com.fintech.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class EmailDebugController {

    private final EmailService emailService;

    public EmailDebugController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail(@RequestParam String to) {
        try {
            emailService.sendSimpleMessage(to, "FinTech Test Email",
                    "This is a test email to verify the SMTP configuration.");
            return ResponseEntity.ok(Map.of("message", "Email command sent to " + to + ". Check logs for status."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
