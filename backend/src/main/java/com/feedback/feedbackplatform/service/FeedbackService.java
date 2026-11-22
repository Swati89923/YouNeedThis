package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.dto.CreateFeedbackRequest;
import com.feedback.feedbackplatform.model.*;
import com.feedback.feedbackplatform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.feedback.feedbackplatform.exception.ApiException;
import com.feedback.feedbackplatform.model.Role;

import java.util.List;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackProjectRepository projectRepository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AuditService auditService;

    public FeedbackService(
            FeedbackRepository feedbackRepository,
            FeedbackProjectRepository projectRepository,
            ProjectAssignmentRepository assignmentRepository,
            UserRepository userRepository,
            PaymentService paymentService,
            NotificationService notificationService, EmailService emailService,
            AuditService auditService
    ) {
        this.feedbackRepository = feedbackRepository;
        this.projectRepository = projectRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.auditService = auditService;
    }


    // =========================
    // SUBMIT FEEDBACK (REVIEWER)
    // =========================
    private static final int SCORE_PER_APPROVED_FEEDBACK = 10;

    @Transactional
    public Feedback submitFeedback(
            Long projectId,
            CreateFeedbackRequest request,
            User reviewer
    ) {
        FeedbackProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));

        if (!assignmentRepository
                .existsByReviewerIdAndProjectId(reviewer.getId(), projectId)) {
            throw ApiException.forbidden("You are not assigned to this project");
        }
        if (feedbackRepository
                .existsByReviewerIdAndProjectId(reviewer.getId(), projectId)) {
            throw ApiException.conflict(
                    "You already submitted feedback for this project");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw ApiException.badRequest("Rating must be between 1 and 5");
        }
        if (request.getComment() == null || request.getComment().isBlank()) {
            throw ApiException.badRequest("Comment is required");
        }

        Feedback feedback = new Feedback();
        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment().trim());
        feedback.setReviewer(reviewer);
        feedback.setProject(project);
        feedback.setStatus(FeedbackStatus.PENDING);
        feedback = feedbackRepository.save(feedback);

        auditService.log("FEEDBACK_SUBMITTED", "FEEDBACK", feedback.getId(), reviewer);
        notificationService.notify(
                project.getCreatedBy(),
                "New feedback on '" + project.getProjectName() + "' is waiting for your review"
        );
        return feedback;
    }

    /** Feedback on one project; only the developer who owns it (or an admin). */
    public List<Feedback> getFeedbackForProject(Long projectId, User caller) {
        FeedbackProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
        assertOwnerOrAdmin(project, caller);
        return feedbackRepository.findByProjectId(projectId);
    }

    public List<Feedback> getFeedbacksByStatus(FeedbackStatus status) {
        return feedbackRepository.findByStatus(status);
    }

    /** Approve: pays the reviewer from escrow. Owner of the project or admin only. */
    @Transactional
    public Feedback approveFeedback(Long feedbackId, User actor) {
        Feedback feedback = loadReviewable(feedbackId, actor);

        FeedbackProject project = feedback.getProject();
        User reviewer = feedback.getReviewer();

        paymentService.releasePayment(
                project.getId(),
                project.getPayPerReview(),
                reviewer
        );

        feedback.setStatus(FeedbackStatus.APPROVED);
        feedbackRepository.save(feedback);

        reviewer.setReviewerScore(
                reviewer.getReviewerScore() + SCORE_PER_APPROVED_FEEDBACK);
        userRepository.save(reviewer);

        notificationService.notify(
                reviewer,
                "Your feedback for project '" + project.getProjectName()
                        + "' has been approved"
        );
        emailService.sendEmail(
                reviewer.getEmail(),
                "Feedback Approved",
                "Your feedback for project '" + project.getProjectName()
                        + "' has been approved."
        );
        auditService.log("FEEDBACK_APPROVED", "FEEDBACK", feedback.getId(), actor);
        return feedback;
    }

    @Transactional
    public Feedback rejectFeedback(Long feedbackId, User actor) {
        Feedback feedback = loadReviewable(feedbackId, actor);

        feedback.setStatus(FeedbackStatus.REJECTED);
        feedbackRepository.save(feedback);

        notificationService.notify(
                feedback.getReviewer(),
                "Your feedback for project '"
                        + feedback.getProject().getProjectName()
                        + "' was rejected"
        );
        auditService.log("FEEDBACK_REJECTED", "FEEDBACK", feedback.getId(), actor);
        return feedback;
    }

    private Feedback loadReviewable(Long feedbackId, User actor) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> ApiException.notFound("Feedback not found"));
        assertOwnerOrAdmin(feedback.getProject(), actor);
        if (feedback.getStatus() != FeedbackStatus.PENDING) {
            throw ApiException.conflict(
                    "Feedback was already " + feedback.getStatus().name().toLowerCase());
        }
        return feedback;
    }

    private void assertOwnerOrAdmin(FeedbackProject project, User user) {
        boolean owner = project.getCreatedBy().getId().equals(user.getId());
        if (!owner && user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("This is not your project");
        }
    }
}
