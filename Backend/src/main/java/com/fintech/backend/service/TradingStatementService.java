package com.fintech.backend.service;

import com.fintech.backend.model.*;
import com.fintech.backend.repository.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class TradingStatementService {

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PortfolioService portfolioService;

        @Autowired
        private TradeRepository tradeRepository;

        public byte[] generateTradingStatement(Long userId, LocalDateTime startDate, LocalDateTime endDate)
                        throws Exception {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                PdfWriter writer = new PdfWriter(baos);
                PdfDocument pdfDoc = new PdfDocument(writer);

                // Add PDF metadata for better compatibility
                com.itextpdf.kernel.pdf.PdfDocumentInfo info = pdfDoc.getDocumentInfo();
                info.setTitle("Trading Account Statement");
                info.setAuthor("FinTech Banking System");
                info.setCreator("FinTech Backend Service");
                info.setSubject("Trading Statement for Account: " + user.getAccountNumber());

                Document document = new Document(pdfDoc);

                // Header
                Paragraph header = new Paragraph("TRADING ACCOUNT STATEMENT")
                                .setFontSize(18)
                                .setBold()
                                .setTextAlignment(TextAlignment.CENTER);
                document.add(header);

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
                document.add(
                                new Paragraph("Statement Period: " + startDate.format(formatter) + " to "
                                                + endDate.format(formatter))
                                                .setTextAlignment(TextAlignment.CENTER)
                                                .setFontSize(10));

                document.add(new Paragraph("\n"));

                // User Details
                Table userTable = new Table(UnitValue.createPercentArray(new float[] { 1, 2 }));
                userTable.setWidth(UnitValue.createPercentValue(100));
                userTable.addCell(new Cell().add(new Paragraph("Account Number:").setBold())
                                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
                userTable.addCell(new Cell().add(new Paragraph(user.getAccountNumber()))
                                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
                userTable.addCell(new Cell().add(new Paragraph("Email:").setBold())
                                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
                userTable.addCell(new Cell().add(new Paragraph(user.getEmail() != null ? user.getEmail() : "N/A"))
                                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
                document.add(userTable);

                document.add(new Paragraph("\n"));

                // Portfolio Summary
                Portfolio portfolio = null;
                try {
                        portfolio = portfolioService.getPortfolio(userId);
                } catch (Exception e) {
                        // User might not have a portfolio yet
                        System.out.println("No portfolio found for user: " + userId);
                }

                BigDecimal currentCash = user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO;
                BigDecimal stockValue = BigDecimal.ZERO;

                if (portfolio != null && portfolio.getHoldings() != null) {
                        for (Holding h : portfolio.getHoldings()) {
                                // Using average buy price for estimation if current price not strictly tracked
                                // here
                                // Ideally we'd fetch current price, but for statement showing book value is
                                // acceptable or use average
                                if (h.getAverageBuyPrice() != null) {
                                        stockValue = stockValue.add(h.getAverageBuyPrice()
                                                        .multiply(new BigDecimal(h.getQuantity())));
                                }
                        }
                }

                document.add(new Paragraph("Portfolio Summary").setBold().setFontSize(14));
                document.add(new Paragraph("Cash Balance: ₹" + currentCash));
                document.add(new Paragraph("Est. Holdings Value: ₹" + stockValue));
                document.add(new Paragraph("Total Portfolio Value: ₹" + currentCash.add(stockValue)).setBold());

                document.add(new Paragraph("\n"));

                // Current Holdings
                document.add(new Paragraph("Current Holdings").setBold().setFontSize(14));
                Table holdingsTable = new Table(UnitValue.createPercentArray(new float[] { 3, 2, 3, 3 }));
                holdingsTable.setWidth(UnitValue.createPercentValue(100));
                holdingsTable.addHeaderCell(
                                new Cell().add(new Paragraph("Symbol").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                holdingsTable.addHeaderCell(
                                new Cell().add(new Paragraph("Qty").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                holdingsTable.addHeaderCell(
                                new Cell().add(new Paragraph("Avg Price").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                holdingsTable.addHeaderCell(
                                new Cell().add(new Paragraph("Inv. Type").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));

                if (portfolio != null && portfolio.getHoldings() != null && !portfolio.getHoldings().isEmpty()) {
                        for (Holding h : portfolio.getHoldings()) {
                                holdingsTable.addCell(new Cell().add(new Paragraph(h.getStockSymbol())));
                                holdingsTable.addCell(new Cell().add(new Paragraph(String.valueOf(h.getQuantity()))));
                                holdingsTable.addCell(new Cell().add(new Paragraph("₹" + h.getAverageBuyPrice())));
                                holdingsTable.addCell(new Cell().add(new Paragraph(h.getInvestmentType().toString())));
                        }
                } else {
                        holdingsTable.addCell(
                                        new Cell(1, 4).add(new Paragraph("No holdings found"))
                                                        .setTextAlignment(TextAlignment.CENTER));
                }
                document.add(holdingsTable);

                document.add(new Paragraph("\n"));

                // Trade History
                document.add(new Paragraph("Trade History").setBold().setFontSize(14));
                Table tradeTable = new Table(UnitValue.createPercentArray(new float[] { 3, 2, 2, 2, 3, 3 }));
                tradeTable.setWidth(UnitValue.createPercentValue(100));

                tradeTable.addHeaderCell(
                                new Cell().add(new Paragraph("Date").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                tradeTable.addHeaderCell(
                                new Cell().add(new Paragraph("Symbol").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                tradeTable.addHeaderCell(
                                new Cell().add(new Paragraph("Type").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                tradeTable.addHeaderCell(
                                new Cell().add(new Paragraph("Qty").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                tradeTable.addHeaderCell(
                                new Cell().add(new Paragraph("Price").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                tradeTable.addHeaderCell(
                                new Cell().add(new Paragraph("Total").setBold())
                                                .setBackgroundColor(ColorConstants.LIGHT_GRAY));

                List<Trade> trades = tradeRepository.findByUserIdAndTimestampBetween(userId, startDate, endDate);
                // Sort by date DESC
                trades.sort((t1, t2) -> t2.getTimestamp().compareTo(t1.getTimestamp()));

                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

                for (Trade t : trades) {
                        tradeTable.addCell(new Cell().add(new Paragraph(t.getTimestamp().format(timeFormatter))));
                        tradeTable.addCell(new Cell().add(new Paragraph(t.getSymbol())));

                        Cell typeCell = new Cell().add(new Paragraph(t.getType().toString()));
                        if (t.getType() == Trade.TradeType.BUY)
                                typeCell.setFontColor(ColorConstants.GREEN);
                        else
                                typeCell.setFontColor(ColorConstants.RED);
                        tradeTable.addCell(typeCell);

                        tradeTable.addCell(new Cell().add(new Paragraph(String.valueOf(t.getQuantity()))));
                        tradeTable.addCell(new Cell().add(new Paragraph("₹" + t.getPrice())));
                        tradeTable.addCell(new Cell().add(new Paragraph("₹" + t.getTotalCost())));
                }

                if (trades.isEmpty()) {
                        tradeTable.addCell(new Cell(1, 6).add(new Paragraph("No trades found in this period"))
                                        .setTextAlignment(TextAlignment.CENTER));
                }

                document.add(tradeTable);

                document.add(new Paragraph("\n\n"));
                document.add(new Paragraph("Generated by FinTech App on " + LocalDateTime.now().format(timeFormatter))
                                .setFontSize(8).setItalic().setTextAlignment(TextAlignment.CENTER));

                document.close();

                return baos.toByteArray();
        }
}
