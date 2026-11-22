package com.feedback.feedbackplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank(message = "Comment cannot be empty")
        @Size(max = 2000, message = "Comment is too long (max 2000 characters)")
        String message
) {
}
