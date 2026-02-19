package com.fintech.backend.service;

import com.fintech.backend.model.Notification;
import com.fintech.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Create and save a new notification
     */
    @Transactional
    public Notification createNotification(String accountNumber, String type, String title, String message,
            String icon) {
        Notification notification = new Notification(accountNumber, type, title, message, icon);
        return notificationRepository.save(notification);
    }

    /**
     * Get all notifications for a user, ordered by timestamp descending
     */
    public List<Notification> getUserNotifications(String accountNumber) {
        return notificationRepository.findByUserAccountNumberOrderByTimestampDesc(accountNumber);
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public boolean markAsRead(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setIsRead(true);
            notificationRepository.save(notification);
            return true;
        }
        return false;
    }

    /**
     * Get count of unread notifications for a user
     */
    public Long getUnreadCount(String accountNumber) {
        return notificationRepository.countByUserAccountNumberAndIsReadFalse(accountNumber);
    }
}
