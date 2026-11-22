package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.dto.DeveloperDashboardResponse;
import com.feedback.feedbackplatform.dto.ReviewerDashboardResponse;
import com.feedback.feedbackplatform.model.EscrowTransaction;
import com.feedback.feedbackplatform.model.Feedback;
import com.feedback.feedbackplatform.model.FeedbackProject;
import com.feedback.feedbackplatform.model.FeedbackStatus;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.EscrowTransactionRepository;
import com.feedback.feedbackplatform.repository.FeedbackProjectRepository;
import com.feedback.feedbackplatform.repository.FeedbackRepository;
import com.feedback.feedbackplatform.repository.ProjectAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final FeedbackProjectRepository projectRepository;
    private final FeedbackRepository feedbackRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final WalletService walletService;

    public AnalyticsService(
            FeedbackProjectRepository projectRepository,
            FeedbackRepository feedbackRepository,
            EscrowTransactionRepository escrowRepository,
            ProjectAssignmentRepository assignmentRepository,
            WalletService walletService
    ) {
        this.projectRepository = projectRepository;
        this.feedbackRepository = feedbackRepository;
        this.escrowRepository = escrowRepository;
        this.assignmentRepository = assignmentRepository;
        this.walletService = walletService;
    }

    /** Only the developer's own projects, feedback and escrow. */
    public DeveloperDashboardResponse developerDashboard(User developer) {
        List<FeedbackProject> projects =
                projectRepository.findByCreatedByIdOrderByIdDesc(developer.getId());
        List<Feedback> feedbacks =
                feedbackRepository.findByProjectCreatedByIdOrderByIdDesc(developer.getId());

        int pending = (int) feedbacks.stream()
                .filter(f -> f.getStatus() == FeedbackStatus.PENDING).count();

        int spent = 0;
        int remaining = 0;
        for (FeedbackProject p : projects) {
            EscrowTransaction escrow = escrowRepository.findByProjectId(p.getId()).orElse(null);
            if (escrow != null) {
                spent += escrow.getTotalAmount() - escrow.getRemainingAmount();
                remaining += escrow.getRemainingAmount();
            }
        }

        double avg = feedbacks.stream().mapToInt(Feedback::getRating).average().orElse(0.0);

        return new DeveloperDashboardResponse(
                projects.size(),
                feedbacks.size(),
                pending,
                spent,
                remaining,
                Math.round(avg * 10.0) / 10.0
        );
    }

    public ReviewerDashboardResponse reviewerDashboard(User reviewer) {
        List<Feedback> mine = feedbackRepository.findByReviewerIdOrderByIdDesc(reviewer.getId());

        int approved = 0;
        int pending = 0;
        int earnings = 0;
        for (Feedback f : mine) {
            if (f.getStatus() == FeedbackStatus.APPROVED) {
                approved++;
                earnings += f.getProject().getPayPerReview();
            } else if (f.getStatus() == FeedbackStatus.PENDING) {
                pending++;
            }
        }

        int active = assignmentRepository
                .findByReviewerIdOrderByIdDesc(reviewer.getId()).size() - mine.size();

        return new ReviewerDashboardResponse(
                mine.size(),
                approved,
                pending,
                Math.max(active, 0),
                reviewer.getReviewerScore(),
                earnings,
                walletService.getOrCreateWallet(reviewer).getBalance()
        );
    }
}
