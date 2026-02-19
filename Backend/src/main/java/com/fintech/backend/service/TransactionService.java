package com.fintech.backend.service;

import com.fintech.backend.annotation.Audited;
import com.fintech.backend.model.Transaction;
import com.fintech.backend.model.User;
import com.fintech.backend.repository.TransactionRepository;
import com.fintech.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class TransactionService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public TransactionService(UserRepository userRepository, TransactionRepository transactionRepository,
            EmailService emailService, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    @Transactional
    @Audited
    public Map<String, Object> transfer(Map<String, Object> payload, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: User not logged in");
        }

        String authAccountNumber = auth.getName();

        // Normalize account number
        String normalizedAuthAccount = authAccountNumber;
        if (normalizedAuthAccount.matches("\\d+")) {
            normalizedAuthAccount = String.format("%010d", Long.parseLong(normalizedAuthAccount));
        }

        final String finalSenderAccount = normalizedAuthAccount;
        User sender = userRepository.findByAccountNumber(finalSenderAccount)
                .orElseThrow(() -> new RuntimeException("Sender account not found: " + finalSenderAccount));

        String targetAccount = payload.get("toAccount") != null ? payload.get("toAccount").toString()
                : (payload.get("targetAccountId") != null ? payload.get("targetAccountId").toString() : null);

        if (targetAccount == null || targetAccount.isEmpty()) {
            throw new RuntimeException("Recipient account number is missing");
        }

        if (targetAccount.matches("\\d+")) {
            targetAccount = String.format("%010d", Long.parseLong(targetAccount));
        }

        final String finalReceiverAccount = targetAccount;
        BigDecimal amount;
        try {
            amount = new BigDecimal(payload.get("amount").toString());
        } catch (Exception e) {
            throw new RuntimeException("Invalid amount format");
        }

        if (finalSenderAccount.equals(finalReceiverAccount)) {
            throw new RuntimeException("You cannot transfer money to your own account");
        }

        User receiver = userRepository.findByAccountNumber(finalReceiverAccount)
                .orElseThrow(
                        () -> new RuntimeException("Recipient account '" + finalReceiverAccount + "' was not found."));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Transfer amount must be greater than zero.");
        }

        if (sender.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance.");
        }

        sender.setBalance(sender.getBalance().subtract(amount));
        receiver.setBalance(receiver.getBalance().add(amount));

        userRepository.save(sender);
        userRepository.save(receiver);

        Transaction transaction = new Transaction();
        transaction.setSenderAccount(finalSenderAccount);
        transaction.setReceiverAccount(finalReceiverAccount);
        transaction.setAmount(amount);
        transaction.setType("TRANSFER");
        transaction.setDescription("Transfer to " + finalReceiverAccount);
        transactionRepository.save(transaction);

        // Send email alert to sender
        if (sender.getEmail() != null && !sender.getEmail().isEmpty()) {
            emailService.sendTransactionAlert(sender.getEmail(), "TRANSFER", amount, finalReceiverAccount);
        } else {
            emailService.sendTransactionAlert(sender.getAccountNumber() + "@gmail.com", "TRANSFER", amount,
                    finalReceiverAccount);
        }

        // Create notifications for both sender and recipient
        notificationService.createNotification(
                finalSenderAccount,
                "TRANSFER_SENT",
                "Fund Transfer Success",
                String.format("Successfully transferred ₹%.2f to account %s", amount, finalReceiverAccount),
                "💸");

        notificationService.createNotification(
                finalReceiverAccount,
                "TRANSFER_RECEIVED",
                "Deposit Received",
                String.format("Received ₹%.2f from account %s", amount, finalSenderAccount),
                "💰");

        return Map.of(
                "message", "Transfer successful",
                "transactionId", transaction.getId(),
                "newBalance", sender.getBalance());
    }

    @Transactional
    @Audited
    public Map<String, Object> deposit(BigDecimal amount) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not logged in");
        }
        String accountNumber = authentication.getName();
        User user = userRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be positive");
        }

        user.setBalance(user.getBalance().add(amount));
        userRepository.save(user);

        Transaction txn = new Transaction();
        txn.setSenderAccount("SYSTEM");
        txn.setReceiverAccount(accountNumber);
        txn.setAmount(amount);
        txn.setType("DEPOSIT");
        txn.setDescription("Self Deposit");
        transactionRepository.save(txn);

        return Map.of("message", "Deposit successful", "newBalance", user.getBalance());
    }

    @Transactional
    @Audited
    public Map<String, Object> withdraw(BigDecimal amount) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not logged in");
        }
        String accountNumber = authentication.getName();
        User user = userRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be positive");
        }

        if (user.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        user.setBalance(user.getBalance().subtract(amount));
        userRepository.save(user);

        Transaction txn = new Transaction();
        txn.setSenderAccount(accountNumber);
        txn.setReceiverAccount("SYSTEM");
        txn.setAmount(amount);
        txn.setType("WITHDRAW");
        txn.setDescription("ATM Withdrawal");
        transactionRepository.save(txn);

        return Map.of("message", "Withdrawal successful", "newBalance", user.getBalance());
    }

    public List<Transaction> getTransactions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not logged in");
        }
        String accountNumber = authentication.getName();
        return transactionRepository.findBySenderAccountOrReceiverAccountOrderByTimestampDesc(accountNumber,
                accountNumber);
    }

    @Transactional
    public Map<String, Object> reverseTransaction(Long txnId) {
        Transaction originalTxn = transactionRepository.findById(txnId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + txnId));

        if (!"TRANSFER".equals(originalTxn.getType())) {
            throw new RuntimeException("Only TRANSFER transactions can be reversed");
        }

        // Logic to reverse the balances
        String senderAccount = originalTxn.getSenderAccount();
        String receiverAccount = originalTxn.getReceiverAccount();
        BigDecimal amount = originalTxn.getAmount();

        User originalSender = userRepository.findByAccountNumber(senderAccount)
                .orElseThrow(() -> new RuntimeException("Original sender account not found"));
        User originalReceiver = userRepository.findByAccountNumber(receiverAccount)
                .orElseThrow(() -> new RuntimeException("Original receiver account not found"));

        // Check if receiver has enough balance to reverse
        if (originalReceiver.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance in recipient account to reverse this transaction");
        }

        // Reverse the balances
        originalSender.setBalance(originalSender.getBalance().add(amount));
        originalReceiver.setBalance(originalReceiver.getBalance().subtract(amount));

        userRepository.save(originalSender);
        userRepository.save(originalReceiver);

        // Record the reversal transaction
        Transaction reversalTxn = new Transaction();
        reversalTxn.setSenderAccount(receiverAccount); // Reversal comes FROM the original receiver
        reversalTxn.setReceiverAccount(senderAccount); // TO the original sender
        reversalTxn.setAmount(amount);
        reversalTxn.setType("REVERSAL");
        reversalTxn.setDescription("Reversal of transaction #" + txnId);
        transactionRepository.save(reversalTxn);

        return Map.of(
                "message", "Transaction reversed successfully",
                "reversalId", reversalTxn.getId(),
                "newBalance", originalSender.getBalance());
    }
}
