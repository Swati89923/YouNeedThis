package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.DeveloperDashboardResponse;
import com.feedback.feedbackplatform.dto.ReviewerDashboardResponse;
import com.feedback.feedbackplatform.service.AnalyticsService;
import com.feedback.feedbackplatform.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final AnalyticsService analyticsService;
    private final UserService userService;

    public DashboardController(
            AnalyticsService analyticsService,
            UserService userService
    ) {
        this.analyticsService = analyticsService;
        this.userService = userService;
    }

    @PreAuthorize("hasRole('REVIEWER')")
    @GetMapping("/reviewer")
    public ReviewerDashboardResponse reviewerDashboard(Authentication authentication) {
        return analyticsService.reviewerDashboard(
                userService.getByEmail(authentication.getName()));
    }

    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/developer")
    public DeveloperDashboardResponse developerDashboard(Authentication authentication) {
        return analyticsService.developerDashboard(
                userService.getByEmail(authentication.getName()));
    }
}
