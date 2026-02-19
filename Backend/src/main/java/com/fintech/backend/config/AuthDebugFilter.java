package com.fintech.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthDebugFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Log all requests for debugging
        if (true) {
            System.out.println("=".repeat(80));
            System.out.println("DEBUG >>> Request Intercepted by AuthDebugFilter");
            System.out.println("  URI: " + request.getRequestURI());
            System.out.println("  Method: " + request.getMethod());
            jakarta.servlet.http.HttpSession session = request.getSession(false);
            if (session != null) {
                System.out.println("  Session ID: " + session.getId());
                System.out.println("  Session Attributes:");
                java.util.Enumeration<String> attrNames = session.getAttributeNames();
                while (attrNames.hasMoreElements()) {
                    String name = attrNames.nextElement();
                    System.out.println("    " + name + ": " + session.getAttribute(name));
                }
            } else {
                System.out.println("  Session: NO SESSION FOUND IN REQUEST");
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                System.out.println("  Authentication: " + auth.getName());
                System.out.println("  Authenticated: " + auth.isAuthenticated());
                System.out.println("  Authorities: " + auth.getAuthorities());
            } else {
                System.out.println("  Authentication: NULL - NOT AUTHENTICATED!");
            }
            System.out.println("=".repeat(80));
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            System.out.println(
                    "DEBUG >>> Response for " + request.getRequestURI() + " - Status: " + response.getStatus());
            System.out.println("=".repeat(80));
        }
    }
}
