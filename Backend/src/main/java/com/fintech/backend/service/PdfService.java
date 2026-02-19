package com.fintech.backend.service;

import com.fintech.backend.model.User;
import com.fintech.backend.repository.UserRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class PdfService {

    private final UserRepository userRepository;

    public PdfService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public byte[] generateMonthlyStatement(String accountNumber) throws Exception {
        Optional<User> userOpt = userRepository.findByAccountNumber(accountNumber);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User user = userOpt.get();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);

        // 1. Title
        Paragraph title = new Paragraph("Monthly Portfolio Statement")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        document.add(new Paragraph("\n"));

        // 2. User Info
        document.add(new Paragraph("Account Number: " + user.getAccountNumber()).setBold());
        document.add(new Paragraph("Role: " + (user.getRole() != null ? user.getRole() : "USER")));
        document.add(new Paragraph("Current Balance: $" + (user.getBalance() != null ? user.getBalance() : "0.00")));
        document.add(new Paragraph(
                "Generated On: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"))));

        document.add(new Paragraph("\n"));

        // 3. Transactions Table
        Table table = new Table(UnitValue.createPercentArray(new float[] { 2, 3, 2 }));
        table.setWidth(UnitValue.createPercentValue(100));

        // Table headers
        table.addHeaderCell(
                new Cell().add(new Paragraph("Date").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        table.addHeaderCell(
                new Cell().add(new Paragraph("Description").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        table.addHeaderCell(
                new Cell().add(new Paragraph("Amount").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));

        // Mock Rows (replace with actual transaction data when available)
        table.addCell(new Cell().add(new Paragraph("2026-02-01")));
        table.addCell(new Cell().add(new Paragraph("Mock Deposit")));
        table.addCell(new Cell().add(new Paragraph("$500.00")));

        table.addCell(new Cell().add(new Paragraph("2026-02-05")));
        table.addCell(new Cell().add(new Paragraph("Stock Purchase: AAPL")));
        table.addCell(new Cell().add(new Paragraph("-$150.00")));

        document.add(table);

        // 4. Profit/Loss Summary
        document.add(new Paragraph("\n"));
        Paragraph summary = new Paragraph("Profit/Loss Summary: +$350.00 (Mock)")
                .setBold()
                .setFontSize(12);
        document.add(summary);

        document.add(new Paragraph("\n"));
        document.add(new Paragraph("This is a computer-generated statement and does not require a signature.")
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setItalic());

        document.close();
        return baos.toByteArray();
    }
}
