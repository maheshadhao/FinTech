# Backend Implementation Guide - Week 4 Compliance Features

## Overview
This guide provides complete Spring Boot backend implementation for the compliance features.

---

## 1. Monthly Statement PDF Endpoint

### Required Dependencies (pom.xml)
```xml
<!-- PDF Generation -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
</dependency>

<!-- Or use Apache PDFBox -->
<dependency>
    <groupId>org.apache.pdfbox</groupId>
    <artifactId>pdfbox</artifactId>
    <version>2.0.29</version>
</dependency>
```

### Controller Implementation
```java
@RestController
@RequestMapping("/api/statements")
public class StatementController {

    @Autowired
    private StatementService statementService;

    @GetMapping("/monthly")
    public ResponseEntity<byte[]> getMonthlyStatement(
        @RequestParam(required = false) String startDate,
        @RequestParam(required = false) String endDate,
        HttpSession session) {
        
        // Get logged-in user from session
        String accountNumber = (String) session.getAttribute("accountNumber");
        
        if (accountNumber == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            // Generate PDF with date range
            byte[] pdfBytes = statementService.generateMonthlyStatement(accountNumber, startDate, endDate);

            // Set headers for PDF download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                "statement_" + accountNumber + "_" + LocalDate.now() + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

### Service Implementation (Using iText7)
```java
@Service
public class StatementService {

    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private AccountRepository accountRepository;

    public byte[] generateMonthlyStatement(String accountNumber, String startDateStr, String endDateStr) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Get account details
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new RuntimeException("Account not found"));

        // Determine date range
        LocalDateTime startDate;
        LocalDateTime endDate;
        if (startDateStr != null && endDateStr != null) {
            startDate = LocalDate.parse(startDateStr).atStartOfDay();
            endDate = LocalDate.parse(endDateStr).atTime(LocalTime.MAX);
        } else {
            startDate = LocalDate.now().minusMonths(1).atStartOfDay();
            endDate = LocalDateTime.now();
        }

        // Get transactions for the range
        List<Transaction> transactions = transactionRepository
            .findByAccountNumberAndDateBetween(accountNumber, startDate, endDate);

        // Header
        document.add(new Paragraph("MONTHLY STATEMENT")
            .setFontSize(20)
            .setBold()
            .setTextAlignment(TextAlignment.CENTER));
        
        document.add(new Paragraph("Account: " + accountNumber));
        document.add(new Paragraph("Period: " + startDate.toLocalDate() + " to " + endDate.toLocalDate()));
        document.add(new Paragraph("Current Balance: $" + account.getBalance()));
        document.add(new Paragraph("\n"));

        // Transaction Table
        Table table = new Table(4);
        table.addHeaderCell("Date");
        table.addHeaderCell("Type");
        table.addHeaderCell("Description");
        table.addHeaderCell("Amount");

        for (Transaction tx : transactions) {
            table.addCell(tx.getTransactionDate().toString());
            table.addCell(tx.getTransactionType());
            table.addCell(tx.getDescription() != null ? tx.getDescription() : "-");
            table.addCell("$" + tx.getAmount());
        }

        document.add(table);
        document.close();

        return baos.toByteArray();
    }
}
```

---

## 2. Audit Logs Endpoint

### Entity Class
```java
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String methodName;

    @Column(columnDefinition = "TEXT")
    private String parameters;

    @Column(nullable = false)
    private Long executionTime; // in milliseconds

    private String userId;
    private String ipAddress;

    // Getters and setters
}
```

### Repository
```java
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);
}
```

### Controller
```java
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping("/logs")
    public ResponseEntity<?> getAuditLogs(HttpSession session) {
        // Check if user is admin
        String role = (String) session.getAttribute("role");
        
        if (!"admin".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Admin access required"));
        }

        try {
            List<AuditLog> logs = auditLogRepository.findTop100ByOrderByTimestampDesc();
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch audit logs"));
        }
    }
}
```

### Audit Logging Aspect (AOP)
```java
@Aspect
@Component
public class AuditAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Around("@annotation(Audited)")
    public Object logAudit(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        String methodName = joinPoint.getSignature().getName();
        String parameters = Arrays.toString(joinPoint.getArgs());
        
        Object result = null;
        try {
            result = joinPoint.proceed();
            return result;
        } finally {
            long executionTime = System.currentTimeMillis() - startTime;
            
            AuditLog log = new AuditLog();
            log.setTimestamp(LocalDateTime.now());
            log.setMethodName(methodName);
            log.setParameters(parameters);
            log.setExecutionTime(executionTime);
            
            // Get user from SecurityContext or session
            // log.setUserId(getCurrentUserId());
            
            auditLogRepository.save(log);
        }
    }
}
```

### Custom Annotation
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
}
```

### Usage Example
```java
@Service
public class TransferService {
    
    @Audited
    public void transferFunds(String from, String to, BigDecimal amount) {
        // Transfer logic
        // This method will be automatically logged
    }
}
```

---

## 3. Security Configuration Updates

### Add Role-Based Access
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/api/audit/**").hasRole("ADMIN")
                .antMatchers("/api/statements/**").authenticated()
                .antMatchers("/login", "/createAccount").permitAll()
                .anyRequest().authenticated()
            .and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED);
    }
}
```

### Store Role in Session (Login)
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
    Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
        .orElseThrow(() -> new RuntimeException("Account not found"));
    
    // Verify password
    if (passwordEncoder.matches(request.getPassword(), account.getPassword())) {
        session.setAttribute("accountNumber", account.getAccountNumber());
        session.setAttribute("role", account.getRole()); // "admin" or "user"
        
        return ResponseEntity.ok(Map.of("status", "success"));
    }
    
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("status", "error", "message", "Invalid credentials"));
}
```

---

## 4. Database Schema Updates

### Add Role Column to Account Table
```sql
ALTER TABLE accounts ADD COLUMN role VARCHAR(20) DEFAULT 'user';

-- Set specific account as admin
UPDATE accounts SET role = 'admin' WHERE account_number = '123456';
```

### Create Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    method_name VARCHAR(255) NOT NULL,
    parameters TEXT,
    execution_time BIGINT NOT NULL,
    user_id VARCHAR(50),
    ip_address VARCHAR(45),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id)
);
```

---

## Testing the Endpoints

### Test Statement Download
```bash
curl -X GET http://localhost:8080/api/statements/monthly \
  --cookie "JSESSIONID=your-session-id" \
  --output statement.pdf
```

### Test Audit Logs
```bash
curl -X GET http://localhost:8080/api/audit/logs \
  --cookie "JSESSIONID=your-session-id"
```

---

## Additional Enhancements

### 1. Add Date Range for Statements
```java
@GetMapping("/monthly")
public ResponseEntity<byte[]> getMonthlyStatement(
    @RequestParam(required = false) String startDate,
    @RequestParam(required = false) String endDate,
    HttpSession session) {
    // Use custom date range if provided
}
```

### 2. Pagination for Audit Logs
```java
@GetMapping("/logs")
public ResponseEntity<?> getAuditLogs(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "50") int size,
    HttpSession session) {
    
    Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
    Page<AuditLog> logs = auditLogRepository.findAll(pageable);
    return ResponseEntity.ok(logs);
}
```

### 3. Filter Audit Logs
```java
@GetMapping("/logs/search")
public ResponseEntity<?> searchLogs(
    @RequestParam(required = false) String methodName,
    @RequestParam(required = false) String userId,
    HttpSession session) {
    // Implement custom search
}
```

---

## Notes
- Ensure all endpoints use `@CrossOrigin` or CORS configuration if frontend is on different port
- Add proper exception handling and logging
- Consider caching for frequently accessed data
- Implement rate limiting for PDF generation to prevent abuse
