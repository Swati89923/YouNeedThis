package com.feedback.feedbackplatform.dto;

import jakarta.validation.constraints.Min;

public record WithdrawRequest(
        @Min(value = 1, message = "Amount must be at least 1")
        int amount
) {
}
