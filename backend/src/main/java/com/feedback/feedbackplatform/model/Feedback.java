package com.feedback.feedbackplatform.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int rating;

    @Column(length = 2000)
    private String comment;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private FeedbackStatus status = FeedbackStatus.PENDING;

    @ManyToOne
    private User reviewer;

    @ManyToOne
    private FeedbackProject project;

    // getters
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getId() {
        return id;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public FeedbackStatus getStatus() {
        return status;
    }

    public User getReviewer() {
        return reviewer;
    }

    public FeedbackProject getProject() {
        return project;
    }

    // setters
    public void setRating(int rating) {
        this.rating = rating;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public void setStatus(FeedbackStatus status) {
        this.status = status;
    }

    public void setReviewer(User reviewer) {
        this.reviewer = reviewer;
    }

    public void setProject(FeedbackProject project) {
        this.project = project;
    }
}
