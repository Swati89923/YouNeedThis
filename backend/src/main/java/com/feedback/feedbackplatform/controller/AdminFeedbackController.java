package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.model.Feedback;
import com.feedback.feedbackplatform.model.FeedbackStatus;
import com.feedback.feedbackplatform.service.FeedbackService;
import com.feedback.feedbackplatform.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/feedbacks")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeedbackController {

    private final FeedbackService feedbackService;
    private final UserService userService;

    public AdminFeedbackController(
            FeedbackService feedbackService,
            UserService userService
    ) {
        this.feedbackService = feedbackService;
        this.userService = userService;
    }

    // 📌 ADMIN: get all pending feedbacks
    @GetMapping("/pending")
    public List<Feedback> getPendingFeedbacks() {
        return feedbackService.getFeedbacksByStatus(FeedbackStatus.PENDING);
    }

    // ✅ ADMIN: approve feedback
    @PostMapping("/{feedbackId}/approve")
    public String approveFeedback(
            @PathVariable Long feedbackId,
            Authentication authentication
    ) {
        feedbackService.approveFeedback(
                feedbackId, userService.getByEmail(authentication.getName()));
        return "Feedback approved";
    }

    // ❌ ADMIN: reject feedback
    @PostMapping("/{feedbackId}/reject")
    public String rejectFeedback(
            @PathVariable Long feedbackId,
            Authentication authentication
    ) {
        feedbackService.rejectFeedback(
                feedbackId, userService.getByEmail(authentication.getName()));
        return "Feedback rejected";
    }
}
