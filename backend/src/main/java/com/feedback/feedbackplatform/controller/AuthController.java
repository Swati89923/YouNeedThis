package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.RegisterRequest;
import com.feedback.feedbackplatform.dto.LoginRequest;
import com.feedback.feedbackplatform.dto.LoginResponse;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.service.UserService;
import com.feedback.feedbackplatform.security.JwtUtil;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // 🔓 REGISTER (PUBLIC)
    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest request) {
        return userService.registerUser(
                request.getName(),
                request.getEmail(),
                request.getPassword(),
                request.getRole()
        );
    }

    // 🔓 LOGIN (PUBLIC)
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {

        User user = userService.login(
                request.getEmail(),
                request.getPassword()
        );

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new LoginResponse(
                token,
                user.getEmail(),
                user.getRole().name()
        );
    }
}
