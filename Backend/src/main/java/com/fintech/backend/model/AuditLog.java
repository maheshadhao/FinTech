package com.fintech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "method_name")
    private String methodName;

    @Column(name = "parameters", length = 4000)
    private String parameters;

    @Column(name = "return_value", length = 4000)
    private String returnValue;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "ip_address")
    private String ipAddress;

    private LocalDateTime timestamp;

    public AuditLog() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public String getParameters() {
        return parameters;
    }

    public void setParameters(String parameters) {
        this.parameters = parameters;
    }

    public String getReturnValue() {
        return returnValue;
    }

    public void setReturnValue(String returnValue) {
        this.returnValue = returnValue;
    }

    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(Long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public static class AuditLogBuilder {
        private String methodName;
        private String parameters;
        private String returnValue;
        private Long executionTimeMs;
        private Integer userId;
        private String ipAddress;
        private LocalDateTime timestamp;

        public AuditLogBuilder methodName(String methodName) {
            this.methodName = methodName;
            return this;
        }

        public AuditLogBuilder parameters(String parameters) {
            this.parameters = parameters;
            return this;
        }

        public AuditLogBuilder returnValue(String returnValue) {
            this.returnValue = returnValue;
            return this;
        }

        public AuditLogBuilder executionTimeMs(Long executionTimeMs) {
            this.executionTimeMs = executionTimeMs;
            return this;
        }

        public AuditLogBuilder userId(Integer userId) {
            this.userId = userId;
            return this;
        }

        public AuditLogBuilder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public AuditLogBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public AuditLog build() {
            AuditLog log = new AuditLog();
            log.setMethodName(methodName);
            log.setParameters(parameters);
            log.setReturnValue(returnValue);
            log.setExecutionTimeMs(executionTimeMs);
            log.setUserId(userId);
            log.setIpAddress(ipAddress);
            log.setTimestamp(timestamp);
            return log;
        }
    }

    public static AuditLogBuilder builder() {
        return new AuditLogBuilder();
    }
}
