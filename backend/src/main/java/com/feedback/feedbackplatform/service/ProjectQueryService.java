package com.feedback.feedbackplatform.service;

import com.feedback.feedbackplatform.dto.ProjectDto;
import com.feedback.feedbackplatform.exception.ApiException;
import com.feedback.feedbackplatform.model.EscrowTransaction;
import com.feedback.feedbackplatform.model.FeedbackProject;
import com.feedback.feedbackplatform.model.FeedbackStatus;
import com.feedback.feedbackplatform.model.ProjectAssignment;
import com.feedback.feedbackplatform.model.Role;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.EscrowTransactionRepository;
import com.feedback.feedbackplatform.repository.FeedbackProjectRepository;
import com.feedback.feedbackplatform.repository.FeedbackRepository;
import com.feedback.feedbackplatform.repository.ProjectAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/** Read side for projects: builds the {@link ProjectDto} each kind of viewer sees. */
@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    private final FeedbackProjectRepository projectRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final FeedbackRepository feedbackRepository;

    public ProjectQueryService(
            FeedbackProjectRepository projectRepository,
            EscrowTransactionRepository escrowRepository,
            ProjectAssignmentRepository assignmentRepository,
            FeedbackRepository feedbackRepository
    ) {
        this.projectRepository = projectRepository;
        this.escrowRepository = escrowRepository;
        this.assignmentRepository = assignmentRepository;
        this.feedbackRepository = feedbackRepository;
    }

    public ProjectDto toDto(FeedbackProject p, User viewer) {
        Optional<EscrowTransaction> escrow = escrowRepository.findByProjectId(p.getId());
        boolean owner = p.getCreatedBy().getId().equals(viewer.getId());
        boolean reviewer = viewer.getRole() == Role.REVIEWER;

        return new ProjectDto(
                p.getId(),
                p.getProjectName(),
                p.getDescription(),
                p.getProjectLink(),
                p.getReviewersNeeded(),
                p.getPayPerReview(),
                p.getCreatedAt(),
                p.getCreatedBy().getId(),
                p.getCreatedBy().getName(),
                escrow.isPresent(),
                escrow.map(EscrowTransaction::getTotalAmount).orElse(0),
                escrow.map(EscrowTransaction::getRemainingAmount).orElse(0),
                reviewer && assignmentRepository
                        .existsByReviewerIdAndProjectId(viewer.getId(), p.getId()),
                reviewer && feedbackRepository
                        .existsByReviewerIdAndProjectId(viewer.getId(), p.getId()),
                owner ? (int) feedbackRepository.countByProjectId(p.getId()) : 0,
                owner ? (int) feedbackRepository
                        .countByProjectIdAndStatus(p.getId(), FeedbackStatus.PENDING) : 0
        );
    }

    /** Funded projects that still have open slots: what a reviewer can browse. */
    public List<ProjectDto> available(User viewer) {
        return projectRepository.findByReviewersNeededGreaterThanOrderByIdDesc(0).stream()
                .filter(p -> escrowRepository.findByProjectId(p.getId()).isPresent())
                .map(p -> toDto(p, viewer))
                .toList();
    }

    public List<ProjectDto> mine(User developer) {
        return projectRepository.findByCreatedByIdOrderByIdDesc(developer.getId()).stream()
                .map(p -> toDto(p, developer))
                .toList();
    }

    public List<ProjectDto> assigned(User reviewer) {
        return assignmentRepository.findByReviewerIdOrderByIdDesc(reviewer.getId()).stream()
                .map(ProjectAssignment::getProject)
                .map(p -> toDto(p, reviewer))
                .toList();
    }

    public ProjectDto get(Long id, User viewer) {
        FeedbackProject project = projectRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
        return toDto(project, viewer);
    }
}
