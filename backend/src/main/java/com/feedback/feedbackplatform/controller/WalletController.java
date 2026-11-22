package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.WalletDto;
import com.feedback.feedbackplatform.service.UserService;
import com.feedback.feedbackplatform.service.WalletService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/wallet")
public class WalletController {

    private final WalletService walletService;
    private final UserService userService;

    public WalletController(WalletService walletService, UserService userService) {
        this.walletService = walletService;
        this.userService = userService;
    }

    @GetMapping
    public WalletDto getMyWallet(Authentication authentication) {
        return new WalletDto(walletService.getOrCreateWallet(
                userService.getByEmail(authentication.getName())).getBalance());
    }
}
