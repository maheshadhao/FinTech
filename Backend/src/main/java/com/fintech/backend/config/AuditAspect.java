package com.fintech.backend.config;

import com.fintech.backend.annotation.Audited;
import com.fintech.backend.model.AuditLog;
import com.fintech.backend.repository.AuditLogRepository;
import com.fintech.backend.service.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Arrays;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    public AuditAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Intercept methods annotated with @Audited for automatic logging
     */
    @Around("@annotation(audited)")
    public Object logAuditedMethod(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        long start = System.currentTimeMillis();

        Object proceed = joinPoint.proceed();

        long executionTime = System.currentTimeMillis() - start;

        try {
            // Get user ID from security context using the new helper method
            Integer userId = getCurrentUserId();

            // Get IP address from request
            String ipAddress = null;
            try {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                        .getRequestAttributes();
                if (attributes != null) {
                    HttpServletRequest request = attributes.getRequest();
                    ipAddress = request.getRemoteAddr();
                }
            } catch (Exception e) {
                // Request context not available
            }

            AuditLog log = AuditLog.builder()
                    .methodName(joinPoint.getSignature().toShortString())
                    .parameters(Arrays.toString(joinPoint.getArgs()))
                    .returnValue(proceed != null ? proceed.toString() : "null")
                    .executionTimeMs(executionTime)
                    .userId(userId)
                    .ipAddress(ipAddress)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Truncate if necessary
            if (log.getReturnValue() != null && log.getReturnValue().length() > 4000) {
                log.setReturnValue(log.getReturnValue().substring(0, 4000));
            }
            if (log.getParameters() != null && log.getParameters().length() > 4000) {
                log.setParameters(log.getParameters().substring(0, 4000));
            }

            auditLogRepository.save(log);
        } catch (Exception e) {
            // Don't fail the actual method if audit logging fails
            e.printStackTrace();
        }

        return proceed;
    }

    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }

        return null;
    }
}
