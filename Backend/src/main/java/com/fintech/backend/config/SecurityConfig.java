package com.fintech.backend.config;

import com.fintech.backend.model.User;
import com.fintech.backend.model.Transaction;
import com.fintech.backend.repository.UserRepository;
import com.fintech.backend.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.fintech.backend.service.UserDetailsImpl;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final AuthenticationConfiguration authenticationConfiguration;
        private final AuthDebugFilter authDebugFilter;

        public SecurityConfig(AuthenticationConfiguration authenticationConfiguration,
                        AuthDebugFilter authDebugFilter) {
                this.authenticationConfiguration = authenticationConfiguration;
                this.authDebugFilter = authDebugFilter;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(request -> {
                                        var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                                        corsConfiguration.setAllowedOrigins(java.util.List.of("http://localhost:3000",
                                                        "http://localhost:5173", "http://127.0.0.1:3000",
                                                        "http://127.0.0.1:5173"));
                                        corsConfiguration
                                                        .setAllowedMethods(java.util.List.of("GET", "POST", "PUT",
                                                                        "DELETE", "OPTIONS", "PATCH"));
                                        corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
                                        corsConfiguration.setAllowCredentials(true);
                                        corsConfiguration.setExposedHeaders(
                                                        java.util.List.of("Set-Cookie", "X-XSRF-TOKEN"));
                                        corsConfiguration.setMaxAge(3600L);
                                        return corsConfiguration;
                                }))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(
                                                                org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED)
                                                .sessionFixation().migrateSession())
                                // Disable CSRF for development/prototype simplicity
                                .csrf(csrf -> csrf.disable())
                                .addFilterAfter(new CsrfCookieFilter(),
                                                org.springframework.security.web.csrf.CsrfFilter.class)
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/h2-console/**"))
                                                .permitAll()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/login"))
                                                .permitAll()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/debug/**"))
                                                .permitAll()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/stocks/**"))
                                                .permitAll()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/account/register"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/account"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/account/**"))
                                                .permitAll()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/audit/**"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/chat"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/balance"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/balance/**"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/portfolio"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/portfolio/**"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/trade/**"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/notifications/**"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/analytics/**"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/transfer"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/history"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/api/metrics/**"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/loggedin_user"))
                                                .authenticated()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/createAccount"))
                                                .permitAll()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/createAccount/**"))
                                                .permitAll()
                                                .requestMatchers(
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/error"),
                                                                org.springframework.security.web.util.matcher.AntPathRequestMatcher
                                                                                .antMatcher("/sw.js"))
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint(
                                                                new org.springframework.security.web.authentication.HttpStatusEntryPoint(
                                                                                org.springframework.http.HttpStatus.UNAUTHORIZED)))
                                .securityContext(context -> context
                                                .securityContextRepository(securityContextRepository()))
                                .addFilterAfter(authDebugFilter,
                                                org.springframework.security.web.context.SecurityContextHolderFilter.class)
                                .addFilterAt(jsonAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                                .formLogin(form -> form.disable())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessHandler((request, response, authentication) -> {
                                                        response.setStatus(
                                                                        jakarta.servlet.http.HttpServletResponse.SC_OK);
                                                })
                                                .deleteCookies("JSESSIONID")
                                                .invalidateHttpSession(true))
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.sameOrigin())
                                                .contentSecurityPolicy(csp -> csp.policyDirectives(
                                                                "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';")));

                return http.build();
        }

        // Filter to ensure CSRF cookie is sent to the client
        private static final class CsrfCookieFilter extends org.springframework.web.filter.OncePerRequestFilter {
                @Override
                protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response, FilterChain filterChain)
                                throws ServletException, java.io.IOException {
                        org.springframework.security.web.csrf.CsrfToken csrfToken = (org.springframework.security.web.csrf.CsrfToken) request
                                        .getAttribute(org.springframework.security.web.csrf.CsrfToken.class.getName());
                        if (csrfToken != null) {
                                csrfToken.getToken();
                        }
                        filterChain.doFilter(request, response);
                }
        }

        @Bean
        public SecurityContextRepository securityContextRepository() {
                return new HttpSessionSecurityContextRepository();
        }

        @Bean
        public JsonAuthenticationFilter jsonAuthenticationFilter() throws Exception {
                JsonAuthenticationFilter filter = new JsonAuthenticationFilter();
                filter.setAuthenticationManager(authenticationConfiguration.getAuthenticationManager());
                filter.setSecurityContextRepository(securityContextRepository());
                filter.setRequiresAuthenticationRequestMatcher(
                                new org.springframework.security.web.util.matcher.AntPathRequestMatcher("/login",
                                                "POST"));
                filter.setUsernameParameter("accountNumber");
                filter.setAuthenticationSuccessHandler((request, response, authentication) -> {
                        System.out.println("DEBUG >>> Login Successful for: " + authentication.getName());
                        // Manually save security context to repository for persistence (Spring Security
                        // 6 requirement)
                        org.springframework.security.core.context.SecurityContext context = SecurityContextHolder
                                        .createEmptyContext();
                        context.setAuthentication(authentication);
                        SecurityContextHolder.setContext(context);

                        SecurityContextRepository repo = securityContextRepository();
                        repo.saveContext(context, request, response);

                        jakarta.servlet.http.HttpSession session = request.getSession(false);
                        if (session != null) {
                                String role = authentication.getAuthorities().stream()
                                                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                                                .findFirst()
                                                .orElse("");
                                if (role.startsWith("ROLE_")) {
                                        role = role.substring(5);
                                }
                                session.setAttribute("role", role);
                                System.out.println("DEBUG >>> Valid Session. Role set to: " + role);

                                System.out.println("DEBUG >>> SecurityContext saved. Session: " + session.getId());
                                System.out.println("DEBUG >>> Session Contains Context: "
                                                + (session.getAttribute("SPRING_SECURITY_CONTEXT") != null));
                        }

                        response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_OK);
                        response.setContentType("application/json");
                        response.getWriter()
                                        .write("{\"status\": \"success\", \"message\": \"Login successful\", \"user\": \""
                                                        + authentication.getName() + "\"}");
                });
                filter.setAuthenticationFailureHandler((request, response, exception) -> {
                        response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Login failed: " + exception.getMessage() + "\"}");
                });
                return filter;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public UserDetailsService userDetailsService(UserRepository userRepository) {
                return accountNumber -> {
                        System.out.println("DEBUG >>> UserDetailsService: account=" + accountNumber);
                        return userRepository.findByAccountNumber(accountNumber)
                                        .map(user -> {
                                                System.out.println("DEBUG >>> User found: " + user.getAccountNumber());
                                                return new UserDetailsImpl(user);
                                        })
                                        .orElseThrow(() -> {
                                                System.out.println("DEBUG >>> User NOT found: " + accountNumber);
                                                return new UsernameNotFoundException(
                                                                "User not found: " + accountNumber);
                                        });
                };
        }

        @Bean
        public CommandLineRunner initData(UserRepository userRepository, TransactionRepository transactionRepository,
                        PasswordEncoder passwordEncoder) {
                return args -> {
                        if (userRepository.findByAccountNumber("0458530329").isEmpty()) {
                                System.out.println("DEBUG >>> Seeding test user: 0458530329");
                                User user = new User();
                                user.setAccountNumber("0458530329");
                                user.setPassword(passwordEncoder.encode("admin123"));
                                user.setRole("ADMIN");
                                user.setBalance(new java.math.BigDecimal("5000.00"));
                                user.setUpiPin("1234");
                                user.setName("Admin User");
                                userRepository.save(user);
                                System.out.println("DEBUG >>> Test user 0458530329 seeded successfully.");
                        }
                        if (userRepository.findByAccountNumber("0888969441").isEmpty()) {
                                System.out.println("DEBUG >>> Seeding test user: 0888969441");
                                User user = new User();
                                user.setAccountNumber("0888969441");
                                user.setPassword(passwordEncoder.encode("admin123"));
                                user.setRole("ADMIN");
                                user.setBalance(new java.math.BigDecimal("1000.00"));
                                user.setUpiPin("1234");
                                user.setEmail("tejasgowda943@gmail.com");
                                user.setName("Tejas Gowda");
                                userRepository.save(user);
                                System.out.println("DEBUG >>> Test user 0888969441 seeded successfully.");
                        }

                        if (transactionRepository.count() == 0) {
                                System.out.println("DEBUG >>> Seeding sample transactions...");
                                String user1 = "0458530329";
                                String user2 = "0888969441";

                                // User1 (Admin) transactions
                                for (int i = 1; i <= 12; i++) {
                                        Transaction t = new Transaction();
                                        t.setSenderAccount("SYSTEM");
                                        t.setReceiverAccount(user1);
                                        t.setAmount(new java.math.BigDecimal(500 + (i * 50)));
                                        t.setType("DEPOSIT");
                                        t.setDescription("Monthly Salary - " + java.time.Month.of(i).name());
                                        t.setTimestamp(java.time.LocalDateTime.now().withMonth(i).withDayOfMonth(1));
                                        transactionRepository.save(t);
                                }

                                // User2 (User) transactions
                                for (int i = 1; i <= 12; i++) {
                                        Transaction t = new Transaction();
                                        t.setSenderAccount("SYSTEM");
                                        t.setReceiverAccount(user2);
                                        t.setAmount(new java.math.BigDecimal(200 + (i * 20)));
                                        t.setType("DEPOSIT");
                                        t.setDescription("Monthly Allowance - " + java.time.Month.of(i).name());
                                        t.setTimestamp(java.time.LocalDateTime.now().withMonth(i).withDayOfMonth(1));
                                        transactionRepository.save(t);

                                        // Add some transfers from user2 back to user1
                                        Transaction t2 = new Transaction();
                                        t2.setSenderAccount(user2);
                                        t2.setReceiverAccount(user1);
                                        t2.setAmount(new java.math.BigDecimal(50 + i));
                                        t2.setType("TRANSFER");
                                        t2.setDescription("Rent Payment - " + java.time.Month.of(i).name());
                                        t2.setTimestamp(java.time.LocalDateTime.now().withMonth(i).withDayOfMonth(15));
                                        transactionRepository.save(t2);
                                }
                                System.out.println("DEBUG >>> Sample transactions seeded successfully.");
                        }
                };
        }
}