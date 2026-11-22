package com.feedback.feedbackplatform.dto;

import java.time.LocalDateTime;

/**
 * What the UI sees for a project. {@code reviewersNeeded} is the number of
 * slots still open. The viewer specific flags depend on who is asking.
 */
public record ProjectDto(
        Long id,
        String projectName,
        String description,
        String projectLink,
        int reviewersNeeded,
        int payPerReview,
        LocalDateTime createdAt,
        Long developerId,
        String developerName,
        boolean funded,
        int escrowTotal,
        int escrowRemaining,
        boolean assignedToMe,
        boolean feedbackSubmittedByMe,
        int feedbackCount,
        int pendingFeedbackCount
) {
}
