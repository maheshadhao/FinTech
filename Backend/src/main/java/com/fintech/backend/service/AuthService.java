package com.fintech.backend.service;

import com.fintech.backend.model.Transaction;
import com.fintech.backend.model.User;
import com.fintech.backend.repository.TransactionRepository;
import com.fintech.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, TransactionRepository transactionRepository,
            PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public Map<String, Object> createAccount(Map<String, Object> request) {
        // Generate a UNIQUE 10-digit account number
        String generatedAccountNumber;
        do {
            generatedAccountNumber = String.format("%010d", (long) (Math.random() * 10000000000L));
        } while (userRepository.findByAccountNumber(generatedAccountNumber).isPresent());

        Object passwordObj = request.get("password");
        String password = passwordObj != null ? passwordObj.toString() : null;

        if (password == null) {
            throw new RuntimeException("Password is required");
        }

        Object upiPinObj = request.get("upiPin");
        if (upiPinObj == null)
            upiPinObj = request.get("upi_pin");
        if (upiPinObj == null)
            upiPinObj = request.get("pin");
        String upiPin = upiPinObj != null ? upiPinObj.toString() : "1234";

        Object initialDepositObj = request.get("initialDeposit");
        BigDecimal balance = new BigDecimal("1000.00");
        if (initialDepositObj != null) {
            try {
                balance = new BigDecimal(initialDepositObj.toString());
            } catch (Exception e) {
                // Invalid initialDeposit, using default
            }
        }

        User user = new User();
        user.setAccountNumber(generatedAccountNumber);
        user.setPassword(passwordEncoder.encode(password));
        user.setUpiPin(upiPin);
        user.setRole("USER");
        user.setBalance(balance);

        Object phoneObj = request.get("mobileNumber");
        if (phoneObj == null)
            phoneObj = request.get("phone");
        if (phoneObj != null)
            user.setPhoneNumber(phoneObj.toString());

        Object emailObj = request.get("email");
        if (emailObj != null) {
            user.setEmail(emailObj.toString());
        }

        userRepository.save(user);

        // Send welcome email if email is provided
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            emailService.sendWelcomeEmail(user.getEmail(), generatedAccountNumber, password, upiPin);
        }

        // Record initial deposit as a transaction
        Transaction initialTxn = new Transaction();
        initialTxn.setSenderAccount("SYSTEM");
        initialTxn.setReceiverAccount(generatedAccountNumber);
        initialTxn.setAmount(balance);
        initialTxn.setType("INITIAL_DEPOSIT");
        initialTxn.setDescription("Initial Account Opening Deposit");
        transactionRepository.save(initialTxn);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Account created successfully");
        response.put("accountNumber", generatedAccountNumber);
        response.put("initialBalance", balance);
        return response;
    }

    public void updateUpiPin(String accountNumber, String oldPin, String newPin) {
        User user = userRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getUpiPin().equals(oldPin)) {
            throw new RuntimeException("Invalid current UPI PIN");
        }

        user.setUpiPin(newPin);
        userRepository.save(user);
    }
}
