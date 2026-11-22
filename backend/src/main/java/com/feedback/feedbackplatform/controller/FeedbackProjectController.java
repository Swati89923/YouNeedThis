package com.feedback.feedbackplatform.controller;

import com.feedback.feedbackplatform.dto.CreateProjectRequest;
import com.feedback.feedbackplatform.dto.ProjectDto;
import com.feedback.feedbackplatform.model.FeedbackProject;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.service.FeedbackProjectService;
import com.feedback.feedbackplatform.service.ProjectQueryService;
import com.feedback.feedbackplatform.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
public class FeedbackProjectController {

    private final FeedbackProjectService service;
    private final ProjectQueryService queries;
    private final UserService userService;

    public FeedbackProjectController(
            FeedbackProjectService service,
            ProjectQueryService queries,
            UserService userService
    ) {
        this.service = service;
        this.queries = queries;
        this.userService = userService;
    }

    private User caller(Authentication authentication) {
        return userService.getByEmail(authentication.getName());
    }

    /** Developer: create a project (it still has to be funded before reviewers see it). */
    @PreAuthorize("hasRole('DEVELOPER')")
    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @RequestBody CreateProjectRequest request,
            Authentication authentication
    ) {
        User developer = caller(authentication);
        FeedbackProject project = service.createProject(request, developer);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(queries.toDto(project, developer));
    }

    /** Reviewer: funded projects that still have open slots. */
    @PreAuthorize("hasRole('REVIEWER')")
    @GetMapping
    public List<ProjectDto> getAvailableProjects(Authentication authentication) {
        return queries.available(caller(authentication));
    }

    /** Developer: my projects. */
    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/mine")
    public List<ProjectDto> myProjects(Authentication authentication) {
        return queries.mine(caller(authentication));
    }

    /** Reviewer: projects I took. */
    @PreAuthorize("hasRole('REVIEWER')")
    @GetMapping("/assigned")
    public List<ProjectDto> assignedProjects(Authentication authentication) {
        return queries.assigned(caller(authentication));
    }

    @GetMapping("/{projectId}")
    public ProjectDto getProject(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        return queries.get(projectId, caller(authentication));
    }

    /** Reviewer: take one of the open slots. */
    @PreAuthorize("hasRole('REVIEWER')")
    @PostMapping("/{projectId}/assign")
    public ProjectDto assignProject(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        User reviewer = caller(authentication);
        service.assignProject(projectId, reviewer);
        return queries.get(projectId, reviewer);
    }
}
