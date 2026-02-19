package com.fintech.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@EnableAsync
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // @Async
    public void sendTransactionAlert(String to, String transactionType, BigDecimal amount, String recipientOrSender) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Transaction Alert: " + transactionType);

            String text = String.format(
                    "Hello,\n\nA %s transaction of $%s has been processed for your account.\n" +
                            "Details:\n" +
                            "- Type: %s\n" +
                            "- Amount: $%s\n" +
                            "- %s: %s\n\n" +
                            "If you did not authorize this transaction, please contact support immediately.\n\n" +
                            "Best Regards,\n" +
                            "FinTech Team",
                    transactionType, amount, transactionType, amount,
                    transactionType.equalsIgnoreCase("TRANSFER") ? "Recipient" : "Counterparty",
                    recipientOrSender);

            message.setText(text);
            mailSender.send(message);
            System.out.println("DEBUG >>> Security Alert Email sent to: " + to);
        } catch (Exception e) {
            System.err.println("ERROR >>> Failed to send email: " + e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String to, String accountNumber, String password, String upiPin) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Welcome to FinTech!");

            String text = String.format(
                    "Hello,\n\nWelcome to FinTech! Your account has been created successfully.\n\n" +
                            "Your Account Number: %s\n" +
                            "Your Password: %s\n" +
                            "Your UPI PIN: %s\n\n" +
                            "You can now log in and start trading or transferring funds.\n\n" +
                            "Best Regards,\n" +
                            "FinTech Team",
                    accountNumber, password, upiPin);

            message.setText(text);
            mailSender.send(message);
            System.out.println("DEBUG >>> Welcome Email sent to: " + to);
        } catch (Exception e) {
            System.err.println("ERROR >>> Failed to send welcome email: " + e.getMessage());
        }
    }

    @Async
    public void sendTradeAlert(String to, String type, String symbol, int quantity, BigDecimal price,
            BigDecimal total) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Trade Confirmation: " + type + " " + symbol);

            String text = String.format(
                    "Hello,\n\nThis is a confirmation of your trade activity.\n\n" +
                            "Details:\n" +
                            "- Action: %s\n" +
                            "- Stock: %s\n" +
                            "- Quantity: %d\n" +
                            "- Price per share: $%s\n" +
                            "- Total Value: $%s\n\n" +
                            "Thank you for choosing FinTech.\n\n" +
                            "Best Regards,\n" +
                            "FinTech Team",
                    type, symbol, quantity, price, total);

            message.setText(text);
            mailSender.send(message);
            System.out.println("DEBUG >>> Trade Alert sent to: " + to);
        } catch (Exception e) {
            System.err.println("ERROR >>> Failed to send trade alert: " + e.getMessage());
        }
    }

    @Async
    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            System.out.println("DEBUG >>> Simple Email sent to: " + to);
        } catch (Exception e) {
            System.err.println("ERROR >>> Failed to send simple email: " + e.getMessage());
        }
    }

    @Async
    public void sendMarketAlert(String to, String symbol, BigDecimal price, String condition) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Market Alert: " + symbol + " is " + condition + " Target");

            String text = String.format(
                    "Hello,\n\nYour alert for %s has been triggered.\n\n" +
                            "Details:\n" +
                            "- Stock: %s\n" +
                            "- Current Price: $%s\n" +
                            "- Condition: %s\n\n" +
                            "Log in to your dashboard to take action.\n\n" +
                            "Best Regards,\n" +
                            "FinTech Team",
                    symbol, symbol, price, condition);

            message.setText(text);
            mailSender.send(message);
            System.out.println("DEBUG >>> Market Alert Email sent to: " + to + " for " + symbol);
        } catch (Exception e) {
            System.err.println("ERROR >>> Failed to send market alert email: " + e.getMessage());
        }
    }

    @Async
    public void sendMarketHighAlert(String to, String symbol, BigDecimal price, BigDecimal changePercent) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("🚀 Market High: " + symbol + " is Surging!");

            String text = String.format(
                    "Hello,\n\nThe stock %s is showing significant gains today.\n\n" +
                            "Details:\n" +
                            "- Stock: %s\n" +
                            "- Current Price: $%s\n" +
                            "- Today's Gain: +%s%%\n\n" +
                            "This could be a great opportunity to check your portfolio.\n\n" +
                            "Best Regards,\n" +
                            "FinTech Team",
                    symbol, symbol, price, changePercent);

            message.setText(text);
            mailSender.send(message);
            System.out.println("DEBUG >>> Market High Email sent to: " + to + " for " + symbol);
        } catch (Exception e) {
            System.err.println("ERROR >>> Failed to send market high email: " + e.getMessage());
        }
    }
}
