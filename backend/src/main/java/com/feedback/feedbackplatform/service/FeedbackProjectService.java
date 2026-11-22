package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.dto.CreateProjectRequest;
import com.feedback.feedbackplatform.model.FeedbackProject;
import com.feedback.feedbackplatform.model.ProjectAssignment;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.FeedbackProjectRepository;
import com.feedback.feedbackplatform.repository.ProjectAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.feedback.feedbackplatform.exception.ApiException;
import com.feedback.feedbackplatform.repository.EscrowTransactionRepository;
import com.feedback.feedbackplatform.service.NotificationService;

import java.util.List;

@Service
public class FeedbackProjectService {

    private final FeedbackProjectRepository repository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final NotificationService notificationService;
    private final EscrowTransactionRepository escrowRepository;

    public FeedbackProjectService(
            FeedbackProjectRepository repository,
            ProjectAssignmentRepository assignmentRepository,
            NotificationService notificationService,
            EscrowTransactionRepository escrowRepository
    ) {
        this.repository = repository;
        this.assignmentRepository = assignmentRepository;
        this.notificationService = notificationService;
        this.escrowRepository = escrowRepository;
    }


    // ✅ CREATE PROJECT (Developer)
    public FeedbackProject createProject(
            CreateProjectRequest request,
            User developer
    ) {
        if (request.getProjectName() == null || request.getProjectName().isBlank()
                || request.getDescription() == null || request.getDescription().isBlank()) {
            throw ApiException.badRequest("Project name and description are required");
        }
        if (request.getReviewersNeeded() < 1 || request.getPayPerReview() < 1) {
            throw ApiException.badRequest(
                    "Reviewers needed and pay per review must be at least 1");
        }
        if (request.getProjectName().length() > 120
                || request.getDescription().length() > 2000) {
            throw ApiException.badRequest(
                    "Project name (max 120) or description (max 2000) is too long");
        }
        String link = request.getProjectLink();
        if (link != null && !link.isBlank() && !link.startsWith("https://")) {
            throw ApiException.badRequest("Project link must start with https://");
        }

        FeedbackProject project = new FeedbackProject();
        project.setProjectName(request.getProjectName());
        project.setDescription(request.getDescription());
        project.setProjectLink(request.getProjectLink());
        project.setReviewersNeeded(request.getReviewersNeeded());
        project.setPayPerReview(request.getPayPerReview());
        project.setCreatedBy(developer);

        return repository.save(project);
    }

    // ✅ GET AVAILABLE PROJECTS (Reviewer)
    public List<FeedbackProject> getAvailableProjects() {
        return repository.findByReviewersNeededGreaterThan(0);
    }

    // ✅ ASSIGN PROJECT TO REVIEWER
    @Transactional
    public String assignProject(Long projectId, User reviewer) {

        FeedbackProject project = repository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));

        if (escrowRepository.findByProjectId(projectId).isEmpty()) {
            throw ApiException.conflict(
                    "The developer has not funded this project yet");
        }

        if (project.getReviewersNeeded() <= 0) {
            throw ApiException.conflict("No reviewer slots left on this project");
        }

        boolean alreadyAssigned =
                assignmentRepository.existsByReviewerIdAndProjectId(
                        reviewer.getId(), projectId
                );

        if (alreadyAssigned) {
            throw ApiException.conflict("You already took this project");
        }

        // 🔽 reduce reviewer count
        project.setReviewersNeeded(project.getReviewersNeeded() - 1);
        repository.save(project);

        // 💾 save assignment
        ProjectAssignment assignment = new ProjectAssignment();
        assignment.setReviewer(reviewer);
        assignment.setProject(project);

        assignmentRepository.save(assignment);
        notificationService.notify(
                reviewer,
                "You have been assigned a new project: "
                        + project.getProjectName()
        );

        return "Project assigned successfully";
    }
}
