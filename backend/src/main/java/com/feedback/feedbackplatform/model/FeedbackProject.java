package com.feedback.feedbackplatform.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class FeedbackProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String projectName;

    @Column(length = 2000)
    private String description;

    private String projectLink;

    private int reviewersNeeded;

    private int payPerReview;

    private LocalDateTime createdAt = LocalDateTime.now();

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    // 🔹 getters
    public Long getId() {
        return id;
    }

    public String getProjectName() {
        return projectName;
    }

    public String getDescription() {
        return description;
    }

    public String getProjectLink() {
        return projectLink;
    }

    public int getReviewersNeeded() {
        return reviewersNeeded;
    }

    public int getPayPerReview() {
        return payPerReview;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    // 🔹 setters
    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setProjectLink(String projectLink) {
        this.projectLink = projectLink;
    }

    public void setReviewersNeeded(int reviewersNeeded) {
        this.reviewersNeeded = reviewersNeeded;
    }

    public void setPayPerReview(int payPerReview) {
        this.payPerReview = payPerReview;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
}
