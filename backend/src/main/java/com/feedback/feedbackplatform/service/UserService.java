package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.exception.ApiException;
import com.feedback.feedbackplatform.exception.InvalidCredentialsException;
import com.feedback.feedbackplatform.model.Role;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ✅ REGISTER
    public User registerUser(String name, String email, String password, Role role) {

        if (name == null || name.isBlank()
                || email == null || email.isBlank()
                || password == null || password.length() < 8) {
            throw ApiException.badRequest(
                    "Name, email and a password of at least 8 characters are required");
        }
        if (role != Role.DEVELOPER && role != Role.REVIEWER) {
            // ADMIN accounts are never created through public sign-up
            throw ApiException.badRequest("Role must be DEVELOPER or REVIEWER");
        }
        email = email.trim().toLowerCase();

        userRepository.findByEmail(email).ifPresent(u -> {
            throw ApiException.conflict("Email already registered");
        });

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

        return userRepository.save(user);
    }

    // ✅ LOGIN
    public User login(String email, String password) {

        User user = userRepository.findByEmail(
                        email == null ? "" : email.trim().toLowerCase())
                .orElseThrow(() ->
                        new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return user;
    }

    // ✅ GET USER BY EMAIL (JWT SUPPORT)
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        ApiException.notFound("User not found"));
    }

    // 🔥 UPDATE PROFILE (NAME + AVATAR)
    public User updateProfile(User user, String name, MultipartFile avatar) {

        // update name
        if (name != null && !name.trim().isEmpty()) {
            user.setName(name);
        }

        // update avatar
        if (avatar != null && !avatar.isEmpty()) {
            try {
                String uploadDir = "uploads/";
                File dir = new File(uploadDir);
                if (!dir.exists()) {
                    dir.mkdirs();
                }

                String filename = UUID.randomUUID() + "_" + avatar.getOriginalFilename();
                File destination = new File(uploadDir + filename);
                avatar.transferTo(destination);

                user.setAvatarUrl("/uploads/" + filename);

            } catch (Exception e) {
                throw new RuntimeException("Failed to upload avatar");
            }
        }

        return userRepository.save(user);
    }
}
