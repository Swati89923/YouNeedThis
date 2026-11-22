package com.feedback.feedbackplatform.dto;

/** Numbers for the developer dashboard, scoped to the developer's own projects. */
public record DeveloperDashboardResponse(
        int totalProjects,
        int totalFeedbacks,
        int pendingReview,
        int totalSpent,
        int escrowRemaining,
        double avgRating
) {
}
