package com.fintech.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class TransferRequest {
    @JsonProperty("fromAccount")
    @JsonAlias({ "from_account", "senderAccount", "fromAccount" })
    private String fromAccount;

    @JsonProperty("toAccount")
    @JsonAlias({ "to_account", "receiverAccount", "recipientAccount", "toAccount" })
    private String toAccount;

    @JsonAlias({ "amount", "transferAmount" })
    private double amount;

    @JsonProperty("upiPin")
    @JsonAlias({ "upi_pin", "pin", "upiPin" })
    private String upiPin;

    public TransferRequest() {
    }

    public TransferRequest(String fromAccount, String toAccount, double amount, String upiPin) {
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.amount = amount;
        this.upiPin = upiPin;
    }

    public String getFromAccount() {
        return fromAccount;
    }

    public void setFromAccount(String fromAccount) {
        this.fromAccount = fromAccount;
    }

    public String getToAccount() {
        return toAccount;
    }

    public void setToAccount(String toAccount) {
        this.toAccount = toAccount;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getUpiPin() {
        return upiPin;
    }

    public void setUpiPin(String upiPin) {
        this.upiPin = upiPin;
    }
}
