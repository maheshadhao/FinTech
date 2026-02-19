package com.fintech.backend.controller;

import com.fintech.backend.model.Notification;
import com.fintech.backend.service.NotificationService;
import com.fintech.backend.service.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private String getAuthenticatedAccountNumber(Authentication authentication, String accountId) {
        if (authentication != null && authentication.isAuthenticated()
                && !authentication.getPrincipal().equals("anonymousUser")) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetailsImpl) {
                return ((UserDetailsImpl) principal).getUsername();
            }
            return authentication.getName(); // Fallback
        }
        return accountId;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestParam(required = false) String accountId,
            Authentication authentication) {
        String accountNumber = getAuthenticatedAccountNumber(authentication, accountId);
        if (accountNumber == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated and no account ID provided"));
        }

        List<Notification> notifications = notificationService.getUserNotifications(accountNumber);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/mark-read/{id}")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @RequestParam(required = false) String accountId,
            Authentication authentication) {
        String accountNumber = getAuthenticatedAccountNumber(authentication, accountId);
        if (accountNumber == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated and no account ID provided"));
        }

        try {
            boolean success = notificationService.markAsRead(id);
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Notification not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestParam(required = false) String accountId,
            Authentication authentication) {
        try {
            String accountNumber = getAuthenticatedAccountNumber(authentication, accountId);
            if (accountNumber == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated and no account ID provided"));
            }

            Long count = notificationService.getUnreadCount(accountNumber);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch unread count: " + e.getMessage()));
        }
    }
}
