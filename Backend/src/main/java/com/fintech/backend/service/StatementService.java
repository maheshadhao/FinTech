package com.fintech.backend.service;

import com.fintech.backend.model.User;
import com.fintech.backend.model.Transaction;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.repository.TransactionRepository;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class StatementService {

        private final UserRepository userRepository;
        private final TransactionRepository transactionRepository;

        public StatementService(UserRepository userRepository, TransactionRepository transactionRepository) {
                this.userRepository = userRepository;
                this.transactionRepository = transactionRepository;
        }

        /**
         * Generate a PDF statement for the user's account
         * 
         * @param accountNumber The user's account number
         * @return PDF as byte array
         */
        public byte[] generateMonthlyStatement(String accountNumber, String startDateStr, String endDateStr)
                        throws Exception {
                User user = userRepository.findByAccountNumber(accountNumber)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                PdfWriter writer = new PdfWriter(baos);
                PdfDocument pdfDoc = new PdfDocument(writer);
                Document document = new Document(pdfDoc);

                // Add header
                Paragraph header = new Paragraph("MONTHLY ACCOUNT STATEMENT")
                                .setFontSize(20)
                                .setBold()
                                .setTextAlignment(TextAlignment.CENTER);
                document.add(header);

                document.add(new Paragraph("\n"));

                // Account details
                LocalDate startDate;
                LocalDate endDate;
                if (startDateStr != null && endDateStr != null) {
                        startDate = LocalDate.parse(startDateStr);
                        endDate = LocalDate.parse(endDateStr);
                } else {
                        endDate = LocalDate.now();
                        startDate = endDate.minusDays(30);
                }
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");

                document.add(new Paragraph("Account Number: " + user.getAccountNumber()).setBold());
                document.add(
                                new Paragraph("Statement Period: " + startDate.format(formatter) + " to "
                                                + endDate.format(formatter)));
                document.add(new Paragraph(
                                "Current Balance: ₹"
                                                + (user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO)));
                document.add(new Paragraph(
                                "Generated On: " + LocalDateTime.now()
                                                .format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"))));

                document.add(new Paragraph("\n"));

                // Transaction table
                Table table = new Table(UnitValue.createPercentArray(new float[] { 2, 2, 3, 2 }));
                table.setWidth(UnitValue.createPercentValue(100));

                // Table headers
                table.addHeaderCell(
                                new Cell().add(new Paragraph("Date").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                table.addHeaderCell(
                                new Cell().add(new Paragraph("Type").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                table.addHeaderCell(
                                new Cell().add(new Paragraph("Description").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                table.addHeaderCell(
                                new Cell().add(new Paragraph("Amount").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));

                // Fetch real transactions
                java.util.List<Transaction> transactions = transactionRepository
                                .findBySenderAccountOrReceiverAccountAndTimestampBetween(accountNumber, accountNumber,
                                                startDate.atStartOfDay(), endDate.atTime(java.time.LocalTime.MAX));

                for (Transaction tx : transactions) {
                        table.addCell(new Cell().add(new Paragraph(tx.getTimestamp().format(formatter))));
                        table.addCell(new Cell().add(new Paragraph(tx.getType())));
                        table.addCell(new Cell()
                                        .add(new Paragraph(tx.getDescription() != null ? tx.getDescription() : "-")));

                        boolean isReceiver = tx.getReceiverAccount().equals(accountNumber);
                        String prefix = isReceiver ? "+" : "-";
                        table.addCell(new Cell().add(new Paragraph(prefix + "₹"
                                        + tx.getAmount().setScale(2, java.math.RoundingMode.HALF_UP))));
                }

                if (transactions.isEmpty()) {
                        table.addCell(new Cell(1, 4).add(new Paragraph("No transactions found for this period.")
                                        .setTextAlignment(TextAlignment.CENTER)));
                }

                document.add(table);

                document.add(new Paragraph("\n"));

                // Footer
                document.add(new Paragraph("This is a computer-generated statement and does not require a signature.")
                                .setFontSize(8)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setItalic());

                document.close();

                return baos.toByteArray();
        }
}
