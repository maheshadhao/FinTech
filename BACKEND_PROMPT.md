# Backend Implementation Prompt - Week 4 Compliance Features

## Context
I need you to implement two REST API endpoints for a Spring Boot banking application to support compliance features. The frontend is already complete and waiting for these endpoints.

## Requirements

### 1. Monthly Statement PDF Download Endpoint

**Endpoint:** `GET /api/statements/monthly`

**Requirements:**
- Generate a PDF containing the user's monthly transaction statement
- Use the logged-in user's account from the HTTP session
- Accept optional `startDate` and `endDate` query parameters (YYYY-MM-DD format)
- If parameters provided, filter transactions by that range; else default to last 30 days
- Include: Account number, statement period, current balance, and transaction table
- Transaction table columns: Date, Type, Description, Amount
- Return PDF as downloadable file with proper headers
- Handle unauthorized access (no session) with 401 status

**Expected Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="statement_[accountNumber]_[date].pdf"`
- Body: PDF byte array

### 2. Audit Logs API Endpoint

**Endpoint:** `GET /api/audit/logs`

**Requirements:**
- Return list of audit log entries (last 100, ordered by timestamp descending)
- Only accessible to users with `role = "admin"` in session
- Return 403 Forbidden for non-admin users
- Each log entry should include: timestamp, methodName, parameters, executionTime (ms)

**Expected Response Format:**
```json
[
  {
    "id": 1,
    "timestamp": "2026-02-04T17:30:00",
    "methodName": "transferFunds",
    "parameters": "[fromAccount=123456, toAccount=789012, amount=500.00]",
    "executionTime": 245
  }
]
```

### 3. Automatic Audit Logging (Bonus)

**Requirements:**
- Create an AOP aspect to automatically log method executions
- Create a custom `@Audited` annotation
- When a method is annotated with `@Audited`, automatically log:
  - Method name
  - Parameters (as string)
  - Execution time
  - Timestamp
- Store logs in `audit_logs` table

**Example Usage:**
```java
@Service
public class TransferService {
    @Audited
    public void transferFunds(String from, String to, BigDecimal amount) {
        // This method will be automatically logged
    }
}
```

## Database Schema

### Add Role Column to Accounts Table
```sql
ALTER TABLE accounts ADD COLUMN role VARCHAR(20) DEFAULT 'user';
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

## Dependencies Needed

Add to `pom.xml`:
```xml
<!-- PDF Generation -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
</dependency>

<!-- AOP for Audit Logging -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

## Session Management

The application uses HTTP sessions with these attributes:
- `accountNumber` - String, set during login
- `role` - String, either "admin" or "user", set during login

**Update Login Endpoint** to store role:
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
    Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
        .orElseThrow(() -> new RuntimeException("Account not found"));
    
    if (passwordEncoder.matches(request.getPassword(), account.getPassword())) {
        session.setAttribute("accountNumber", account.getAccountNumber());
        session.setAttribute("role", account.getRole()); // ADD THIS
        return ResponseEntity.ok(Map.of("status", "success"));
    }
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("status", "error"));
}
```

## Implementation Checklist

- [ ] Create `StatementController` with `/api/statements/monthly` endpoint
- [ ] Create `StatementService` with PDF generation logic
- [ ] Create `AuditLog` entity class
- [ ] Create `AuditLogRepository` interface
- [ ] Create `AuditController` with `/api/audit/logs` endpoint
- [ ] Create `@Audited` annotation
- [ ] Create `AuditAspect` for automatic logging
- [ ] Update login endpoint to store role in session
- [ ] Run database schema updates
- [ ] Test both endpoints with session cookies

## Testing

**Test Statement Download:**
```bash
curl -X GET http://localhost:8080/api/statements/monthly \
  --cookie "JSESSIONID=your-session-id" \
  --output statement.pdf
```

**Test Audit Logs (as admin):**
```bash
curl -X GET http://localhost:8080/api/audit/logs \
  --cookie "JSESSIONID=admin-session-id"
```

## Notes
- Use `@CrossOrigin` or configure CORS if frontend is on different port (e.g., localhost:3000)
- Ensure `withCredentials: true` is set in frontend (already done)
- PDF should be professional-looking with proper formatting
- Consider adding pagination for audit logs in future iterations
- All endpoints should handle errors gracefully and return appropriate HTTP status codes

## Success Criteria
- PDF downloads successfully from frontend "Download Statement" button
- Audit logs table populates with data when navigating to `/audit-logs` as admin
- Non-admin users cannot access audit logs (403 error)
- Methods annotated with `@Audited` automatically create log entries
