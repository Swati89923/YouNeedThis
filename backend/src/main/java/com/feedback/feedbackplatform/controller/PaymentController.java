package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.model.EscrowTransaction;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.service.PaymentService;
import com.feedback.feedbackplatform.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;

    public PaymentController(
            PaymentService paymentService,
            UserService userService
    ) {
        this.paymentService = paymentService;
        this.userService = userService;
    }

    // 🔐 DEVELOPER: deposit escrow for a project
    @PreAuthorize("hasRole('DEVELOPER')")
    @PostMapping("/deposit/{projectId}")
    public EscrowTransaction deposit(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        User developer =
                userService.getByEmail(authentication.getName());

        return paymentService.depositToEscrow(projectId, developer);
    }

    // ⚙️ SYSTEM/ADMIN: release payment to reviewer wallet
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/release/{projectId}")
    public String releasePayment(
            @PathVariable Long projectId,
            @RequestParam int amount,
            @RequestParam String reviewerEmail
    ) {
        User reviewer = userService.getByEmail(reviewerEmail);

        paymentService.releasePayment(projectId, amount, reviewer);
        return "Payment released & wallet credited";
    }
}
