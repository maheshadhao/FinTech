package com.fintech.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;

@Service
public class OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public OpenAIService() {
        this.restTemplate = new RestTemplate();
    }

    public String analyzePortfolio(String portfolioJson) {
        if (apiKey == null || apiKey.isEmpty() || "YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "API Key is missing. Please configure openai.api.key in application.properties.";
        }

        String prompt = """
                You are a professional financial portfolio analyst AI.

                Analyze the following investment portfolio data.

                Tasks:
                1. Explain overall performance in simple language
                2. Identify risk concentration
                3. Comment on diversification
                4. Highlight strengths and weaknesses
                5. Give 3 actionable improvement suggestions
                6. Assign a risk score: Low / Medium / High

                Portfolio data:
                """ + portfolioJson + """

                Respond clearly in short paragraphs.
                Avoid jargon. Be beginner friendly.
                """;

        return callOpenAI(prompt);
    }

    public String chatWithPortfolio(String portfolioJson, String userMessage) {
        if (apiKey == null || apiKey.isEmpty() || "YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "API Key is missing. Please configure openai.api.key in application.properties.";
        }

        String prompt = """
                You are an AI financial assistant helping a user understand their investments.

                Rules:
                - Speak in simple language
                - Be educational, not pushy
                - Never give illegal or unethical advice
                - Focus on risk awareness
                - Encourage diversification

                User portfolio:
                """ + portfolioJson + """

                User question:
                """ + userMessage + """

                Answer clearly and concisely.
                """;

        return callOpenAI(prompt);
    }

    public String auditPortfolio(String portfolioJson) {
        if (apiKey == null || apiKey.isEmpty() || "YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "API Key is missing. Please configure openai.api.key in application.properties.";
        }

        String prompt = """
                Act as a portfolio risk auditor.

                Evaluate the portfolio below.

                Detect:
                - Sector overexposure
                - Volatility risk
                - Lack of diversification
                - Concentration risk

                Return:
                1. Risk level (Low / Medium / High)
                2. Main danger
                3. Suggested fix

                Portfolio:
                """ + portfolioJson;

        return callOpenAI(prompt);
    }

    public String predictOutlook(String portfolioJson) {
        if (apiKey == null || apiKey.isEmpty() || "YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "API Key is missing. Please configure openai.api.key in application.properties.";
        }

        String prompt = """
                Based on this portfolio's structure and performance,
                estimate possible short-term outlook.

                Provide:
                - Expected trend: Up / Neutral / Down
                - Risk probability %
                - One paragraph explanation

                Portfolio:
                """ + portfolioJson;

        return callOpenAI(prompt);
    }

    private String callOpenAI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4o-mini"); // Cost-effective model
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> messageContent = (Map<String, Object>) choice.get("message");
                    return (String) messageContent.get("content");
                }
            }
            return "No response from AI.";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error calling AI service: " + e.getMessage();
        }
    }
}
