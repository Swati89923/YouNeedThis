package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.CommentDto;
import com.feedback.feedbackplatform.dto.CommentRequest;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.service.FeedbackCommentService;
import com.feedback.feedbackplatform.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The conversation between a developer and a reviewer about one piece of feedback. */
@RestController
@RequestMapping("/feedback-comments")
public class FeedbackCommentController {

    private final FeedbackCommentService commentService;
    private final UserService userService;

    public FeedbackCommentController(
            FeedbackCommentService commentService,
            UserService userService
    ) {
        this.commentService = commentService;
        this.userService = userService;
    }

    @PostMapping("/{feedbackId}")
    @Transactional
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long feedbackId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        User author = userService.getByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(CommentDto.from(
                commentService.addComment(feedbackId, request.message(), author)));
    }

    @GetMapping("/{feedbackId}")
    @Transactional(readOnly = true)
    public List<CommentDto> getComments(
            @PathVariable Long feedbackId,
            Authentication authentication
    ) {
        User viewer = userService.getByEmail(authentication.getName());
        return commentService.getComments(feedbackId, viewer)
                .stream().map(CommentDto::from).toList();
    }
}
