package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.model.Feedback;
import com.feedback.feedbackplatform.model.FeedbackComment;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.FeedbackCommentRepository;
import com.feedback.feedbackplatform.repository.FeedbackRepository;
import org.springframework.stereotype.Service;
import com.feedback.feedbackplatform.exception.ApiException;
import com.feedback.feedbackplatform.model.Role;
import java.util.List;

@Service
public class FeedbackCommentService {

    private final FeedbackCommentRepository commentRepository;
    private final FeedbackRepository feedbackRepository;

    public FeedbackCommentService(
            FeedbackCommentRepository commentRepository,
            FeedbackRepository feedbackRepository
    ) {
        this.commentRepository = commentRepository;
        this.feedbackRepository = feedbackRepository;
    }

    public FeedbackComment addComment(
            Long feedbackId,
            String message,
            User author
    ) {
        // 1️⃣ feedback exists?
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> ApiException.notFound("Feedback not found"));
        assertParticipant(feedback, author);

        // 2️⃣ simple validation
        if (message == null || message.trim().isEmpty()) {
            throw ApiException.badRequest("Comment cannot be empty");
        }

        // 3️⃣ save comment
        FeedbackComment comment = new FeedbackComment();
        comment.setMessage(message.trim());
        comment.setAuthor(author);
        comment.setFeedback(feedback);

        return commentRepository.save(comment);
    }

    public List<FeedbackComment> getComments(Long feedbackId, User viewer) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> ApiException.notFound("Feedback not found"));
        assertParticipant(feedback, viewer);
        return commentRepository.findByFeedbackId(feedbackId);
    }

    /** Only the reviewer who wrote the feedback and the project owner may see or write comments. */
    private void assertParticipant(Feedback feedback, User user) {
        boolean reviewer = feedback.getReviewer().getId().equals(user.getId());
        boolean owner = feedback.getProject().getCreatedBy().getId().equals(user.getId());
        if (!reviewer && !owner && user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You are not part of this feedback");
        }
    }
}
