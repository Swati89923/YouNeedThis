package com.feedback.feedbackplatform.dto;

import com.feedback.feedbackplatform.model.Feedback;
import com.feedback.feedbackplatform.model.FeedbackStatus;

import java.time.LocalDateTime;

public record FeedbackDto(
        Long id,
        int rating,
        String comment,
        FeedbackStatus status,
        Long projectId,
        String projectName,
        Long reviewerId,
        String reviewerName,
        int payPerReview,
        LocalDateTime createdAt
) {
    public static FeedbackDto from(Feedback f) {
        return new FeedbackDto(
                f.getId(),
                f.getRating(),
                f.getComment(),
                f.getStatus(),
                f.getProject().getId(),
                f.getProject().getProjectName(),
                f.getReviewer().getId(),
                f.getReviewer().getName(),
                f.getProject().getPayPerReview(),
                f.getCreatedAt()
        );
    }
}
