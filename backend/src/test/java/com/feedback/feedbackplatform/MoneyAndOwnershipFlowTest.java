package com.feedback.feedbackplatform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.feedback.feedbackplatform.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MoneyAndOwnershipFlowTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtUtil jwtUtil;

    // ---------- helpers ----------

    private String register(String role) throws Exception {
        String email = role.toLowerCase() + "-" + UUID.randomUUID() + "@test.dev";
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"T\",\"email\":\"" + email
                                + "\",\"password\":\"password123\",\"role\":\"" + role + "\"}"))
                .andExpect(status().isOk());
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private ResultActions call(MockHttpServletRequestBuilder req, String token) throws Exception {
        return mvc.perform(token == null ? req : req.header("Authorization", "Bearer " + token));
    }

    private long createProject(String devToken, int reviewers, int pay) throws Exception {
        String body = call(post("/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectName\":\"App\",\"description\":\"Try it\","
                        + "\"projectLink\":\"https://example.com\",\"reviewersNeeded\":" + reviewers
                        + ",\"payPerReview\":" + pay + "}"), devToken)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    // ---------- tests ----------

    @Test
    void tokenIsSignedWithConfiguredSecretAndAccepted() throws Exception {
        String dev = register("DEVELOPER");
        assertEquals("DEVELOPER", jwtUtil.parse(dev).get("role", String.class));
        call(get("/users/me"), dev).andExpect(status().isOk());
    }

    @Test
    void missingOrBrokenTokenIs401() throws Exception {
        call(get("/users/me"), null).andExpect(status().isUnauthorized());
        call(get("/users/me"), "not-a-jwt").andExpect(status().isUnauthorized());
    }

    @Test
    void adminCannotBeRegisteredPublicly() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"A\",\"email\":\"a-" + UUID.randomUUID()
                                + "@test.dev\",\"password\":\"password123\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateEmailIsConflict() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@test.dev";
        String body = "{\"name\":\"D\",\"email\":\"" + email
                + "\",\"password\":\"password123\",\"role\":\"REVIEWER\"}";
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void nobodyButAdminCanReleaseEscrowMoney() throws Exception {
        String dev = register("DEVELOPER");
        String rev = register("REVIEWER");
        long project = createProject(dev, 1, 100);
        call(post("/payments/deposit/" + project), dev).andExpect(status().isOk());

        for (String token : new String[]{dev, rev}) {
            call(post("/payments/release/" + project)
                    .param("amount", "100").param("reviewerEmail", "x@test.dev"), token)
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void rolesAreEnforcedOnProjectEndpoints() throws Exception {
        String dev = register("DEVELOPER");
        String rev = register("REVIEWER");

        call(post("/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectName\":\"X\",\"description\":\"Y\",\"reviewersNeeded\":1,\"payPerReview\":5}"), rev)
                .andExpect(status().isForbidden());

        long project = createProject(dev, 1, 50);
        call(post("/projects/" + project + "/assign"), dev).andExpect(status().isForbidden());
        call(post("/payments/deposit/" + project), rev).andExpect(status().isForbidden());
    }

    @Test
    void escrowOnlyByOwnerAndOnlyOnce_andAssignNeedsFunding() throws Exception {
        String dev = register("DEVELOPER");
        String otherDev = register("DEVELOPER");
        String rev = register("REVIEWER");
        long project = createProject(dev, 2, 30);

        // not funded yet, so a reviewer cannot take it
        call(post("/projects/" + project + "/assign"), rev).andExpect(status().isConflict());

        // a different developer cannot fund it
        call(post("/payments/deposit/" + project), otherDev).andExpect(status().isForbidden());

        call(post("/payments/deposit/" + project), dev).andExpect(status().isOk());
        call(post("/payments/deposit/" + project), dev).andExpect(status().isConflict());

        call(post("/projects/" + project + "/assign"), rev).andExpect(status().isOk());
        call(post("/projects/" + project + "/assign"), rev).andExpect(status().isConflict());
    }

    @Test
    void feedbackFlow_oneFeedbackPerReviewer_ownerOnlyView_commentsRestricted() throws Exception {
        String dev = register("DEVELOPER");
        String otherDev = register("DEVELOPER");
        String rev = register("REVIEWER");
        String stranger = register("REVIEWER");
        long project = createProject(dev, 1, 75);
        call(post("/payments/deposit/" + project), dev).andExpect(status().isOk());

        String feedbackBody = "{\"rating\":4,\"comment\":\"Nice but slow on first load\"}";

        // a reviewer who did not take the project cannot review it
        call(post("/api/v1/feedback/project/" + project).contentType(MediaType.APPLICATION_JSON)
                .content(feedbackBody), stranger).andExpect(status().isForbidden());

        call(post("/projects/" + project + "/assign"), rev).andExpect(status().isOk());

        // a bad rating is a client error, not a 500
        call(post("/api/v1/feedback/project/" + project).contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":9,\"comment\":\"x\"}"), rev).andExpect(status().isBadRequest());

        String saved = call(post("/api/v1/feedback/project/" + project)
                .contentType(MediaType.APPLICATION_JSON).content(feedbackBody), rev)
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long feedbackId = json.readTree(saved).get("id").asLong();

        call(post("/api/v1/feedback/project/" + project).contentType(MediaType.APPLICATION_JSON)
                .content(feedbackBody), rev).andExpect(status().isConflict());

        // only the owner reads feedback
        call(get("/api/v1/feedback/project/" + project), dev).andExpect(status().isOk());
        call(get("/api/v1/feedback/project/" + project), otherDev).andExpect(status().isForbidden());

        // comments are only for the two people involved
        call(get("/feedback-comments/" + feedbackId), stranger).andExpect(status().isForbidden());
        call(get("/feedback-comments/" + feedbackId), rev).andExpect(status().isOk());
    }
}
