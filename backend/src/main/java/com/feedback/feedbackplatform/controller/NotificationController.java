package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.NotificationDto;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.service.NotificationService;
import com.feedback.feedbackplatform.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(
            NotificationService notificationService,
            UserService userService
    ) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public List<NotificationDto> myNotifications(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        return notificationService.getMyNotifications(user)
                .stream().map(NotificationDto::from).toList();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(userService.getByEmail(authentication.getName()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            Authentication authentication
    ) {
        notificationService.markRead(id, userService.getByEmail(authentication.getName()));
        return ResponseEntity.noContent().build();
    }
}
