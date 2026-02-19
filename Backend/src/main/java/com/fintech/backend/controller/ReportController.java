package com.fintech.backend.controller;

import com.fintech.backend.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final PdfService pdfService;

    public ReportController(PdfService pdfService) {
        this.pdfService = pdfService;
    }

    @GetMapping("/statement")
    public ResponseEntity<byte[]> getMonthlyStatement(Authentication authentication) {
        try {
            // Ensure authenticated user can only access their own statement
            String accountNumber = authentication.getName();

            byte[] pdfBytes = pdfService.generateMonthlyStatement(accountNumber);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "statement.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
