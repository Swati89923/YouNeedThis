package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.WalletDto;
import com.feedback.feedbackplatform.dto.WithdrawRequest;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.service.NotificationService;
import com.feedback.feedbackplatform.service.UserService;
import com.feedback.feedbackplatform.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wallet")
public class WalletController {

    private final WalletService walletService;
    private final UserService userService;
    private final NotificationService notificationService;

    public WalletController(
            WalletService walletService,
            UserService userService,
            NotificationService notificationService
    ) {
        this.walletService = walletService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public WalletDto getMyWallet(Authentication authentication) {
        return new WalletDto(walletService.getOrCreateWallet(
                userService.getByEmail(authentication.getName())).getBalance());
    }

    /** Reviewer: withdraw part or all of the balance. The payout itself is simulated. */
    @PreAuthorize("hasRole('REVIEWER')")
    @PostMapping("/withdraw")
    @Transactional
    public WalletDto withdraw(
            @Valid @RequestBody WithdrawRequest request,
            Authentication authentication
    ) {
        User user = userService.getByEmail(authentication.getName());
        int balance = walletService.debit(user, request.amount()).getBalance();
        notificationService.notify(user,
                "Withdrawal of ₹" + request.amount() + " requested");
        return new WalletDto(balance);
    }
}
