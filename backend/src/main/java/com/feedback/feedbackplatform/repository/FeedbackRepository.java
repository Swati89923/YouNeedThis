package com.feedback.feedbackplatform.repository;

import com.feedback.feedbackplatform.model.Feedback;
import com.feedback.feedbackplatform.model.FeedbackStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByStatus(FeedbackStatus status);

    List<Feedback> findByReviewerId(Long reviewerId);

    List<Feedback> findByProjectId(Long projectId);

    boolean existsByReviewerIdAndProjectId(Long reviewerId, Long projectId);

    List<Feedback> findByReviewerIdOrderByIdDesc(Long reviewerId);

    List<Feedback> findByProjectIdOrderByIdDesc(Long projectId);

    List<Feedback> findByProjectCreatedByIdOrderByIdDesc(Long developerId);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, FeedbackStatus status);
}
