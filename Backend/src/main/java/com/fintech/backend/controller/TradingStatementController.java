package com.fintech.backend.controller;

import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.service.TradingStatementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/statements")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TradingStatementController {

    @Autowired
    private TradingStatementService tradingStatementService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/trading")
    public ResponseEntity<?> downloadTradingStatement(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            String accountNumber = auth.getName();
            User user = userRepository.findByAccountNumber(accountNumber)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            LocalDateTime end = (endDate != null && !endDate.isEmpty())
                    ? LocalDate.parse(endDate).atTime(23, 59, 59)
                    : LocalDateTime.now();

            LocalDateTime start = (startDate != null && !startDate.isEmpty())
                    ? LocalDate.parse(startDate).atStartOfDay()
                    : end.minusDays(30);

            byte[] pdfBytes = tradingStatementService.generateTradingStatement(user.getId(), start, end);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
            String filename = "trading_statement_" + start.format(formatter) + "_to_" + end.format(formatter) + ".pdf";
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            headers.setAccessControlExposeHeaders(java.util.List.of("Content-Disposition"));

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate statement: " + e.getMessage()));
        }
    }
}
