package com.fintech.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Map;

public class JsonAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {
        String contentType = request.getContentType();
        String method = request.getMethod();
        System.out.println("JsonAuthenticationFilter called. Method: " + method + ", Content-Type: " + contentType);
        if ("POST".equalsIgnoreCase(method) && "/login".equals(request.getServletPath()) && contentType != null
                && contentType.toLowerCase().startsWith("application/json")) {
            try {
                Map<String, String> requestMap = objectMapper.readValue(request.getInputStream(),
                        new TypeReference<Map<String, String>>() {
                        });
                String accountNumber = requestMap.get("accountNumber");
                String password = requestMap.get("password");
                System.out.println("Extracted from JSON - accountNumber: " + accountNumber);

                if (accountNumber == null)
                    accountNumber = "";
                if (password == null)
                    password = "";

                accountNumber = accountNumber.trim();

                UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(accountNumber,
                        password);
                setDetails(request, authRequest);
                return this.getAuthenticationManager().authenticate(authRequest);
            } catch (IOException e) {
                throw new AuthenticationServiceException("Failed to parse authentication request body", e);
            }
        }
        return super.attemptAuthentication(request, response);
    }
}
