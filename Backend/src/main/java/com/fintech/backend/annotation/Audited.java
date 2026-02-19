package com.fintech.backend.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods for automatic audit logging.
 * When applied to a method, the AuditAspect will automatically log:
 * - Method name
 * - Parameters
 * - Execution time
 * - Timestamp
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
}
