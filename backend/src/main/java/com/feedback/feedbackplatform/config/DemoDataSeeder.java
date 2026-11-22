package com.feedback.feedbackplatform.config;

import com.feedback.feedbackplatform.dto.CreateFeedbackRequest;
import com.feedback.feedbackplatform.dto.CreateProjectRequest;
import com.feedback.feedbackplatform.model.FeedbackProject;
import com.feedback.feedbackplatform.model.Role;
import com.feedback.feedbackplatform.model.User;
import com.feedback.feedbackplatform.repository.UserRepository;
import com.feedback.feedbackplatform.service.FeedbackProjectService;
import com.feedback.feedbackplatform.service.FeedbackService;
import com.feedback.feedbackplatform.service.PaymentService;
import com.feedback.feedbackplatform.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Local demo data so the UI is not empty on first start. Only runs when
 * {@code app.seed-demo-data=true}, which only the dev profile sets.
 *
 * Logins: developer@demo.dev and reviewer@demo.dev, password Demo@1234
 */
@Component
@ConditionalOnProperty(name = "app.seed-demo-data", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String PASSWORD = "Demo@1234";

    private final UserService userService;
    private final UserRepository userRepository;
    private final FeedbackProjectService projectService;
    private final PaymentService paymentService;
    private final FeedbackService feedbackService;

    public DemoDataSeeder(
            UserService userService,
            UserRepository userRepository,
            FeedbackProjectService projectService,
            PaymentService paymentService,
            FeedbackService feedbackService
    ) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.paymentService = paymentService;
        this.feedbackService = feedbackService;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("developer@demo.dev").isPresent()) {
            return;
        }

        User dev = userService.registerUser(
                "Dana Developer", "developer@demo.dev", PASSWORD, Role.DEVELOPER);
        User reviewer = userService.registerUser(
                "Riya Reviewer", "reviewer@demo.dev", PASSWORD, Role.REVIEWER);

        FeedbackProject checkout = fundedProject(dev, "ShopEasy checkout flow",
                "Walk through adding items to the cart and paying. Tell us where you "
                        + "hesitated, what felt slow and what was confusing.",
                "https://example.com/shopeasy", 3, 150);
        fundedProject(dev, "Recipe Box mobile app",
                "Try saving a recipe, searching by ingredient and sharing a list. "
                        + "We care most about the search screen.",
                "https://play.google.com/store/apps/details?id=com.example.recipebox", 2, 200);
        fundedProject(dev, "Portfolio website redesign",
                "Check the new landing page on your phone and laptop: layout, "
                        + "readability and loading time.",
                "https://example.com/portfolio", 5, 80);

        // a project nobody has funded yet, so the "Fund escrow" step is visible
        projectService.createProject(
                request("Habit tracker beta", "Early build, needs first impressions of onboarding.",
                        "https://example.com/habits", 2, 120), dev);

        // one pending feedback so the review queue has something in it
        projectService.assignProject(checkout.getId(), reviewer);
        CreateFeedbackRequest fb = new CreateFeedbackRequest();
        fb.setRating(4);
        fb.setComment("Checkout is clear and quick. The promo code field is easy to miss "
                + "on small screens, and the order summary should show delivery cost earlier.");
        feedbackService.submitFeedback(checkout.getId(), fb, reviewer);

        log.info("Demo data ready: developer@demo.dev / reviewer@demo.dev (password {})", PASSWORD);
    }

    private FeedbackProject fundedProject(
            User dev, String name, String description, String link, int slots, int pay
    ) {
        FeedbackProject project = projectService.createProject(
                request(name, description, link, slots, pay), dev);
        paymentService.depositToEscrow(project.getId(), dev);
        return project;
    }

    private CreateProjectRequest request(
            String name, String description, String link, int slots, int pay
    ) {
        CreateProjectRequest r = new CreateProjectRequest();
        r.setProjectName(name);
        r.setDescription(description);
        r.setProjectLink(link);
        r.setReviewersNeeded(slots);
        r.setPayPerReview(pay);
        return r;
    }
}
