package com.fintech.backend.service;

import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.repository.TransactionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ChatService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final StockService stockService;
    private final TradeService tradeService;

    public ChatService(UserRepository userRepository, TransactionRepository transactionRepository,
            StockService stockService, TradeService tradeService) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.stockService = stockService;
        this.tradeService = tradeService;
    }

    public Map<String, Object> processChat(String message, Authentication auth) {
        String query = message.toLowerCase();
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> actionParams = new HashMap<>();

        String intent = detectIntent(query);
        extractParameters(intent, query, actionParams);

        // If intent is TRADE_STOCK, execute a mock trade to trigger audit logging
        if ("TRADE_STOCK".equals(intent) && auth != null && auth.isAuthenticated()) {
            String symbol = (String) actionParams.get("symbol");
            String action = (String) actionParams.get("action");
            Integer quantity = (Integer) actionParams.get("quantity");
            if (symbol != null && action != null) {
                java.math.BigDecimal price = stockService.getPrice(symbol);
                if (price != null) {
                    tradeService.executeTrade(auth.getName(), symbol, action, quantity != null ? quantity : 1, price);
                }
            }
        }

        String context = buildContext(intent, query, auth, new HashMap<>());
        String aiResponse = generateNaturalLanguageResponse(intent, query, actionParams, context, auth);

        result.put("response", aiResponse);
        result.put("intent", intent);
        result.put("actionParameters", actionParams);
        result.put("metadata", Map.of(
                "authenticated", auth != null && auth.isAuthenticated(),
                "timestamp", System.currentTimeMillis()));

        return result;
    }

    private String detectIntent(String query) {
        if (query.contains("send") || query.contains("transfer") || query.contains("pay"))
            return "SEND_MONEY";
        if (query.contains("buy") || query.contains("sell") || query.contains("trade"))
            return "TRADE_STOCK";
        if (query.contains("price") || query.contains("quote") || query.contains("ticker"))
            return "STOCK_QUOTE";
        if (query.contains("balance") || query.contains("portfolio") || query.contains("my money"))
            return "VIEW_PORTFOLIO";
        return "GENERAL_CHAT";
    }

    private void extractParameters(String intent, String query, Map<String, Object> params) {
        if (intent.equals("SEND_MONEY")) {
            params.put("amount", extractAmount(query));
            params.put("recipient", extractAccountNumber(query));
        } else if (intent.equals("TRADE_STOCK")) {
            params.put("action", query.contains("buy") ? "BUY" : "SELL");
            params.put("symbol", extractSymbol(query));
            params.put("quantity", extractQuantity(query));
        } else if (intent.equals("STOCK_QUOTE")) {
            params.put("symbol", extractSymbol(query));
        }
    }

    private String generateNaturalLanguageResponse(String intent, String query, Map<String, Object> params,
            String context, Authentication auth) {
        boolean loggedIn = auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser");

        switch (intent) {
            case "SEND_MONEY":
                if (!loggedIn)
                    return "I'd love to help you send money, but you'll need to log in first!";
                if (params.get("recipient") == null)
                    return "Who would you like to send money to?";
                if (params.get("amount") == null)
                    return "How much would you like to send to " + params.get("recipient") + "?";
                return "I've prepared a transfer of ₹" + params.get("amount") + " to account " + params.get("recipient")
                        + ". Please confirm the details in the transfer window.";

            case "TRADE_STOCK":
                if (!loggedIn)
                    return "Stock trading requires you to be logged into your Financo account.";
                String action = (String) params.get("action");
                String symbol = (String) params.get("symbol");
                if (symbol == null)
                    return "Which stock would you like to " + action.toLowerCase() + "?";
                return "Sure! I'm opening the trade modal for " + symbol + ". You requested to " + action.toLowerCase()
                        + " " + (params.get("quantity") != null ? params.get("quantity") : "some") + " shares.";

            case "STOCK_QUOTE":
                String sym = (String) params.get("symbol");
                if (sym == null)
                    return "I can get stock quotes for you. Which ticker are you interested in?";
                java.math.BigDecimal price = stockService.getPrice(sym);
                return price != null ? "The current price for " + sym.toUpperCase() + " is $" + price + "."
                        : "I couldn't find a price for " + sym + ". Is the ticker correct?";

            case "VIEW_PORTFOLIO":
                if (!loggedIn)
                    return "Log in to see your portfolio and cash balance.";
                return "I'm navigating you to your portfolio overview. Your current cash balance is ₹"
                        + extractValue(context, "Cash Balance ₹") + ".";

            default:
                return "I'm your Financo AI. I can help you send money, trade stocks, or check your portfolio. What's on your mind?";
        }
    }

    private String buildContext(String intent, String query, Authentication auth, Map<String, Object> data) {
        StringBuilder context = new StringBuilder("System Context: You are a professional Financo AI advisor.");

        // 1. Handle Stock Data
        if (intent.equals("STOCK_QUOTE") || intent.equals("TRADE_STOCK")) {
            String symbol = extractSymbol(query);
            if (symbol != null) {
                java.math.BigDecimal price = stockService.getPrice(symbol);
                if (price != null) {
                    context.append("\nMarket Data: ").append(symbol).append(" is currently at $").append(price);
                    // data.put("stock", Map.of("symbol", symbol.toUpperCase(), "price", price)); //
                    // No longer needed for direct return
                }
            } else if (query.contains("market") || query.contains("stocks")) {
                var overview = stockService.getMarketOverview();
                context.append("\nMarket Overview: ").append(overview.toString());
                // data.put("marketOverview", overview); // No longer needed for direct return
            }
        }

        // 2. Handle Portfolio Data
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String accountNumber = auth.getName();
            userRepository.findByAccountNumber(accountNumber).ifPresent(user -> {
                context.append("\nUser Portfolio: Account ").append(user.getAccountNumber())
                        .append(", Cash Balance ₹").append(user.getBalance());

                if (intent.equals("VIEW_PORTFOLIO")) {
                    // data.put("cashBalance", user.getBalance()); // No longer needed for direct
                    // return
                    if (query.contains("transaction") || query.contains("history")) {
                        var txns = transactionRepository
                                .findBySenderAccountOrReceiverAccountOrderByTimestampDesc(accountNumber, accountNumber)
                                .stream().limit(3).collect(java.util.stream.Collectors.toList());
                        context.append("\nRecent Activity: ").append(txns.toString());
                        // data.put("recentTransactions", txns); // No longer needed for direct return
                    }
                }
            });
        }

        return context.toString();
    }

    private String extractAmount(String query) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+(\\.\\d+)?)").matcher(query);
        return m.find() ? m.group(1) : null;
    }

    private String extractAccountNumber(String query) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d{10}").matcher(query);
        return m.find() ? m.group(0) : null;
    }

    private Integer extractQuantity(String query) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)\\s+(shares|units|of)").matcher(query);
        return m.find() ? Integer.parseInt(m.group(1)) : null;
    }

    private String extractSymbol(String query) {
        String[] possibleSymbols = { "AAPL", "GOOGL", "MSFT", "TSLA", "AMZN" };
        for (String sym : possibleSymbols) {
            if (query.contains(sym.toLowerCase()))
                return sym.toUpperCase();
        }
        return null;
    }

    private String extractValue(String context, String marker) {
        try {
            int start = context.indexOf(marker) + marker.length();
            int end = context.indexOf(",", start);
            if (end == -1)
                end = context.indexOf("\n", start);
            if (end == -1)
                end = context.length();
            return context.substring(start, end).trim();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
