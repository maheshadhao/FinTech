package com.fintech.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trades")
public class Trade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TradeType type; // BUY, SELL

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal price;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal totalCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestmentType investmentType = InvestmentType.SHORT_TERM;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public TradeType getType() {
        return type;
    }

    public void setType(TradeType type) {
        this.type = type;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public InvestmentType getInvestmentType() {
        return investmentType;
    }

    public void setInvestmentType(InvestmentType investmentType) {
        this.investmentType = investmentType;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public enum TradeType {
        BUY, SELL
    }

    public static class TradeBuilder {
        private Long userId;
        private String symbol;
        private TradeType type;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal totalCost;
        private InvestmentType investmentType;
        private LocalDateTime timestamp;

        public TradeBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public TradeBuilder symbol(String symbol) {
            this.symbol = symbol;
            return this;
        }

        public TradeBuilder type(TradeType type) {
            this.type = type;
            return this;
        }

        public TradeBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public TradeBuilder price(BigDecimal price) {
            this.price = price;
            return this;
        }

        public TradeBuilder totalCost(BigDecimal totalCost) {
            this.totalCost = totalCost;
            return this;
        }

        public TradeBuilder investmentType(InvestmentType investmentType) {
            this.investmentType = investmentType;
            return this;
        }

        public TradeBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Trade build() {
            Trade trade = new Trade();
            trade.setUserId(userId);
            trade.setSymbol(symbol);
            trade.setType(type);
            trade.setQuantity(quantity);
            trade.setPrice(price);
            trade.setTotalCost(totalCost);
            trade.setInvestmentType(investmentType);
            trade.setTimestamp(timestamp);
            return trade;
        }
    }

    public static TradeBuilder builder() {
        return new TradeBuilder();
    }
}
