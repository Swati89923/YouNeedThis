package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.model.Notification;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.feedback.feedbackplatform.exception.ApiException;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public void notify(User user, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);

        repository.save(notification);
    }

    public List<Notification> getMyNotifications(User user) {
        return repository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public void markAllRead(User user) {
        List<Notification> unread = repository.findByUserIdAndSeenFalse(user.getId());
        unread.forEach(n -> n.setSeen(true));
        repository.saveAll(unread);
    }

    @Transactional
    public void markRead(Long id, User user) {
        Notification n = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw ApiException.notFound("Notification not found");
        }
        n.setSeen(true);
        repository.save(n);
    }
}
