package com.fintech.backend.controller;

import com.fintech.backend.model.AuditLog;
import com.fintech.backend.repository.AuditLogRepository;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Get all audit logs
     */
    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        try {
            List<AuditLog> logs = auditLogRepository.findAll();
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get audit log by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAuditLogById(@PathVariable Long id) {
        try {
            return auditLogRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch audit log"));
        }
    }

    /**
     * Get recent audit logs (last N entries)
     */
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentAuditLogs(@RequestParam(defaultValue = "50") int limit) {
        try {
            List<AuditLog> logs = auditLogRepository.findAll();
            // Get the most recent entries
            int startIndex = Math.max(0, logs.size() - limit);
            List<AuditLog> recentLogs = logs.subList(startIndex, logs.size());
            return ResponseEntity.ok(recentLogs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch recent audit logs"));
        }
    }

    /**
     * Get count of audit logs
     */
    @GetMapping("/count")
    public ResponseEntity<?> getAuditLogCount() {
        try {
            long count = auditLogRepository.count();
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to count audit logs"));
        }
    }

    /**
     * Get audit logs - Admin only
     * Returns last 100 logs ordered by timestamp descending
     */
    @GetMapping("/logs")
    public ResponseEntity<?> getAuditLogs() {
        try {
            // Get last 100 logs ordered by timestamp descending
            List<AuditLog> logs = auditLogRepository.findAll(
                    Sort.by(Sort.Direction.DESC, "timestamp"));

            // Limit to 100 entries
            if (logs.size() > 100) {
                logs = logs.subList(0, 100);
            }

            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            System.err.println("DEBUG >>> Error fetching audit logs: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch audit logs"));
        }
    }
}
