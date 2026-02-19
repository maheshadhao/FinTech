package com.fintech.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RegisterRequest {
    @JsonProperty("accountNumber")
    private String accountNumber;

    @JsonProperty("password")
    private String password;

    @JsonProperty("upiPin")
    private String upiPin;

    public RegisterRequest() {
    }

    public RegisterRequest(String accountNumber, String password, String upiPin) {
        this.accountNumber = accountNumber;
        this.password = password;
        this.upiPin = upiPin;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUpiPin() {
        return upiPin;
    }

    public void setUpiPin(String upiPin) {
        this.upiPin = upiPin;
    }

    @JsonProperty("account_number")
    public void setAccountNumberSnake(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    @JsonProperty("upi_pin")
    public void setUpiPinSnake(String upiPin) {
        this.upiPin = upiPin;
    }
}
