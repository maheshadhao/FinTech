package com.fintech.backend.repository;

import com.fintech.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a specific user, ordered by timestamp descending
     * (newest first)
     */
    List<Notification> findByUserAccountNumberOrderByTimestampDesc(String userAccountNumber);

    /**
     * Count unread notifications for a specific user
     */
    Long countByUserAccountNumberAndIsReadFalse(String userAccountNumber);
}
