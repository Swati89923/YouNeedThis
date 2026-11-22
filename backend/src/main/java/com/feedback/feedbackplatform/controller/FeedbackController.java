package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.CreateFeedbackRequest;
import com.feedback.feedbackplatform.dto.FeedbackDto;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.FeedbackRepository;
import com.feedback.feedbackplatform.service.FeedbackService;
import com.feedback.feedbackplatform.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final UserService userService;
    private final FeedbackRepository feedbackRepository;

    public FeedbackController(
            FeedbackService feedbackService,
            UserService userService,
            FeedbackRepository feedbackRepository
    ) {
        this.feedbackService = feedbackService;
        this.userService = userService;
        this.feedbackRepository = feedbackRepository;
    }

    private User caller(Authentication authentication) {
        return userService.getByEmail(authentication.getName());
    }

    /** Reviewer: submit feedback for a project I took. */
    @PreAuthorize("hasRole('REVIEWER')")
    @PostMapping("/project/{projectId}")
    @Transactional
    public ResponseEntity<FeedbackDto> submitFeedback(
            @PathVariable Long projectId,
            @RequestBody CreateFeedbackRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(FeedbackDto.from(
                feedbackService.submitFeedback(projectId, request, caller(authentication))));
    }

    /** Reviewer: everything I submitted. */
    @PreAuthorize("hasRole('REVIEWER')")
    @GetMapping("/mine")
    @Transactional(readOnly = true)
    public List<FeedbackDto> myFeedback(Authentication authentication) {
        return feedbackRepository
                .findByReviewerIdOrderByIdDesc(caller(authentication).getId())
                .stream().map(FeedbackDto::from).toList();
    }

    /** Developer: feedback on one of my projects. */
    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/project/{projectId}")
    @Transactional(readOnly = true)
    public List<FeedbackDto> getFeedbackForProject(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        return feedbackService.getFeedbackForProject(projectId, caller(authentication))
                .stream().map(FeedbackDto::from).toList();
    }

    /** Developer: feedback on all my projects, newest first. */
    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/received")
    @Transactional(readOnly = true)
    public List<FeedbackDto> receivedFeedback(Authentication authentication) {
        return feedbackRepository
                .findByProjectCreatedByIdOrderByIdDesc(caller(authentication).getId())
                .stream().map(FeedbackDto::from).toList();
    }

    /** Developer: accept feedback, which pays the reviewer from escrow. */
    @PreAuthorize("hasRole('DEVELOPER')")
    @PostMapping("/{feedbackId}/approve")
    @Transactional
    public FeedbackDto approve(
            @PathVariable Long feedbackId,
            Authentication authentication
    ) {
        return FeedbackDto.from(
                feedbackService.approveFeedback(feedbackId, caller(authentication)));
    }

    @PreAuthorize("hasRole('DEVELOPER')")
    @PostMapping("/{feedbackId}/reject")
    @Transactional
    public FeedbackDto reject(
            @PathVariable Long feedbackId,
            Authentication authentication
    ) {
        return FeedbackDto.from(
                feedbackService.rejectFeedback(feedbackId, caller(authentication)));
    }
}
