package com.feedback.feedbackplatform.dto;

import com.feedback.feedbackplatform.model.FeedbackComment;
import com.feedback.feedbackplatform.model.Role;

import java.time.LocalDateTime;

public record CommentDto(
        Long id,
        String message,
        Long authorId,
        String authorName,
        Role authorRole,
        LocalDateTime createdAt
) {
    public static CommentDto from(FeedbackComment c) {
        return new CommentDto(
                c.getId(),
                c.getMessage(),
                c.getAuthor().getId(),
                c.getAuthor().getName(),
                c.getAuthor().getRole(),
                c.getCreatedAt()
        );
    }
}
