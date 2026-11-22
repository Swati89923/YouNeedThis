package com.feedback.feedbackplatform.dto;

import com.feedback.feedbackplatform.model.Notification;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String message,
        boolean seen,
        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(n.getId(), n.getMessage(), n.isSeen(), n.getCreatedAt());
    }
}
