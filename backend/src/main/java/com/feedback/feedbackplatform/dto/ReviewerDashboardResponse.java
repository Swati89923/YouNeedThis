package com.feedback.feedbackplatform.dto;

public record ReviewerDashboardResponse(
        int totalFeedbacks,
        int approvedFeedbacks,
        int pendingFeedbacks,
        int activeProjects,
        int reviewerScore,
        int totalEarnings,
        int walletBalance
) {
}
