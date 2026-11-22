package com.feedback.feedbackplatform.repository;

import com.feedback.feedbackplatform.model.FeedbackProject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackProjectRepository extends JpaRepository<FeedbackProject, Long> {

    // 🔥 Reviewer ke liye sirf available projects
    List<FeedbackProject> findByReviewersNeededGreaterThan(int count);

    List<FeedbackProject> findByCreatedByIdOrderByIdDesc(Long developerId);

    List<FeedbackProject> findByReviewersNeededGreaterThanOrderByIdDesc(int count);
}
