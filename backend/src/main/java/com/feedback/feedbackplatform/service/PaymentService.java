package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.model.EscrowTransaction;
import com.feedback.feedbackplatform.model.FeedbackProject;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.EscrowTransactionRepository;
import com.feedback.feedbackplatform.repository.FeedbackProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.feedback.feedbackplatform.exception.ApiException;

@Service
public class PaymentService {

    private final EscrowTransactionRepository escrowRepository;
    private final FeedbackProjectRepository projectRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final EmailService emailService; // ✅ ADD THIS

    public PaymentService(
            EscrowTransactionRepository escrowRepository,
            FeedbackProjectRepository projectRepository,
            WalletService walletService,
            NotificationService notificationService,
            EmailService emailService // ✅ ADD THIS
    ) {
        this.escrowRepository = escrowRepository;
        this.projectRepository = projectRepository;
        this.walletService = walletService;
        this.notificationService = notificationService;
        this.emailService = emailService; // ✅ ASSIGN
    }

    // 🔐 Developer deposits money
    @Transactional
    public EscrowTransaction depositToEscrow(
            Long projectId,
            User developer
    ) {
        FeedbackProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));

        if (!project.getCreatedBy().getId().equals(developer.getId())) {
            throw ApiException.forbidden("This is not your project");
        }
        if (escrowRepository.findByProjectId(projectId).isPresent()) {
            throw ApiException.conflict("This project is already funded");
        }

        int totalAmount =
                project.getReviewersNeeded() * project.getPayPerReview();

        EscrowTransaction escrow = new EscrowTransaction();
        escrow.setProject(project);
        escrow.setDeveloper(developer);
        escrow.setTotalAmount(totalAmount);
        escrow.setRemainingAmount(totalAmount);

        return escrowRepository.save(escrow);
    }

    // 💸 Release payment AFTER feedback approval
    @Transactional
    public void releasePayment(
            Long projectId,
            int amount,
            User reviewer
    ) {
        EscrowTransaction escrow = escrowRepository
                .findByProjectId(projectId)
                .orElseThrow(() -> ApiException.conflict("Project has no escrow"));

        if (escrow.getRemainingAmount() < amount) {
            throw ApiException.conflict("Insufficient escrow balance");
        }

        // 1️⃣ Escrow se paisa kam
        escrow.setRemainingAmount(
                escrow.getRemainingAmount() - amount
        );
        escrowRepository.save(escrow);

        // 2️⃣ Wallet credit
        walletService.credit(reviewer, amount);

        // 3️⃣ In-app notification
        notificationService.notify(
                reviewer,
                "₹" + amount + " has been credited to your wallet"
        );

        // 4️⃣ Email notification ✅
        emailService.sendEmail(
                reviewer.getEmail(),
                "Payment Credited",
                "₹" + amount + " has been credited to your wallet."
        );
    }
}
