package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.ProjectDto;
import com.feedback.feedbackplatform.service.ProjectQueryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private final ProjectQueryService projectQueryService;

    public PaymentController(
            PaymentService paymentService,
            UserService userService,
            ProjectQueryService projectQueryService
    ) {
        this.paymentService = paymentService;
        this.userService = userService;
        this.projectQueryService = projectQueryService;
    }

    // 🔐 DEVELOPER: deposit escrow for a project
    @PreAuthorize("hasRole('DEVELOPER')")
    @PostMapping("/deposit/{projectId}")
    public ResponseEntity<ProjectDto> deposit(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        User developer =
                userService.getByEmail(authentication.getName());

        paymentService.depositToEscrow(projectId, developer);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectQueryService.get(projectId, developer));
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
