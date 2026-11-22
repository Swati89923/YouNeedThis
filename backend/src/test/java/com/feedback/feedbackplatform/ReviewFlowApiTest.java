package com.feedback.feedbackplatform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The whole loop the UI drives: fund, take, review, approve, get paid. */
@SpringBootTest
@AutoConfigureMockMvc
class ReviewFlowApiTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String signUp(String role) throws Exception {
        String email = role.toLowerCase() + "-" + UUID.randomUUID() + "@flow.dev";
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Flow " + role + "\",\"email\":\"" + email
                        + "\",\"password\":\"password123\",\"role\":\"" + role + "\"}"))
                .andExpect(status().isCreated());
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private ResultActions call(MockHttpServletRequestBuilder req, String token) throws Exception {
        return mvc.perform(req.header("Authorization", "Bearer " + token));
    }

    private JsonNode read(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString());
    }

    @Test
    void fullLoop_approvalPaysTheReviewerAndUpdatesEveryScreen() throws Exception {
        String dev = signUp("DEVELOPER");
        String rev = signUp("REVIEWER");

        JsonNode project = read(call(post("/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectName\":\"Flow app\",\"description\":\"Please try it\","
                        + "\"projectLink\":\"https://example.com\",\"reviewersNeeded\":2,\"payPerReview\":60}"), dev)
                .andExpect(status().isCreated()));
        long id = project.get("id").asLong();
        assertFalse(project.get("funded").asBoolean());

        // an unfunded project is not offered to reviewers
        JsonNode before = read(call(get("/projects"), rev).andExpect(status().isOk()));
        for (JsonNode p : before) {
            assertTrue(p.get("id").asLong() != id);
        }

        JsonNode funded = read(call(post("/payments/deposit/" + id), dev)
                .andExpect(status().isCreated()));
        assertTrue(funded.get("funded").asBoolean());
        assertEquals(120, funded.get("escrowTotal").asInt());

        boolean listed = false;
        for (JsonNode p : read(call(get("/projects"), rev).andExpect(status().isOk()))) {
            listed |= p.get("id").asLong() == id;
        }
        assertTrue(listed, "funded project should be offered to reviewers");

        JsonNode taken = read(call(post("/projects/" + id + "/assign"), rev)
                .andExpect(status().isOk()));
        assertTrue(taken.get("assignedToMe").asBoolean());
        assertEquals(1, taken.get("reviewersNeeded").asInt());
        assertEquals(1, read(call(get("/projects/assigned"), rev)).size());

        JsonNode feedback = read(call(post("/api/v1/feedback/project/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":5,\"comment\":\"Great onboarding, search is slow\"}"), rev)
                .andExpect(status().isCreated()));
        long feedbackId = feedback.get("id").asLong();
        assertEquals("PENDING", feedback.get("status").asText());
        assertEquals("Flow app", feedback.get("projectName").asText());

        // developer sees it, project card counts it, notification arrived
        assertEquals(1, read(call(get("/api/v1/feedback/received"), dev)).size());
        assertEquals(1, read(call(get("/projects/mine"), dev)).get(0).get("pendingFeedbackCount").asInt());
        assertEquals(1, read(call(get("/notifications"), dev)).size());

        // a reviewer cannot approve their own work
        call(post("/api/v1/feedback/" + feedbackId + "/approve"), rev)
                .andExpect(status().isForbidden());

        // comment thread
        call(post("/feedback-comments/" + feedbackId).contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"Which screen was slow?\"}"), dev)
                .andExpect(status().isCreated());
        call(post("/feedback-comments/" + feedbackId).contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"   \"}"), rev).andExpect(status().isBadRequest());
        JsonNode comments = read(call(get("/feedback-comments/" + feedbackId), rev));
        assertEquals(1, comments.size());
        assertEquals("DEVELOPER", comments.get(0).get("authorRole").asText());

        // approve: wallet is credited once, escrow shrinks, score goes up
        JsonNode approved = read(call(post("/api/v1/feedback/" + feedbackId + "/approve"), dev)
                .andExpect(status().isOk()));
        assertEquals("APPROVED", approved.get("status").asText());
        call(post("/api/v1/feedback/" + feedbackId + "/approve"), dev)
                .andExpect(status().isConflict());
        call(post("/api/v1/feedback/" + feedbackId + "/reject"), dev)
                .andExpect(status().isConflict());

        assertEquals(60, read(call(get("/wallet"), rev)).get("balance").asInt());

        JsonNode reviewerStats = read(call(get("/api/v1/dashboard/reviewer"), rev));
        assertEquals(1, reviewerStats.get("approvedFeedbacks").asInt());
        assertEquals(60, reviewerStats.get("totalEarnings").asInt());
        assertEquals(10, reviewerStats.get("reviewerScore").asInt());

        JsonNode devStats = read(call(get("/api/v1/dashboard/developer"), dev));
        assertEquals(1, devStats.get("totalProjects").asInt());
        assertEquals(1, devStats.get("totalFeedbacks").asInt());
        assertEquals(60, devStats.get("totalSpent").asInt());
        assertEquals(60, devStats.get("escrowRemaining").asInt());
        assertEquals(5.0, devStats.get("avgRating").asDouble(), 0.001);

        // reviewer was told, and can clear the badge
        JsonNode notes = read(call(get("/notifications"), rev));
        assertTrue(notes.size() >= 2);
        call(post("/notifications/read-all"), rev).andExpect(status().isNoContent());
        for (JsonNode n : read(call(get("/notifications"), rev))) {
            assertTrue(n.get("seen").asBoolean());
        }
    }

    @Test
    void rejectingFeedbackDoesNotPay() throws Exception {
        String dev = signUp("DEVELOPER");
        String rev = signUp("REVIEWER");
        long id = read(call(post("/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectName\":\"R\",\"description\":\"D\",\"reviewersNeeded\":1,\"payPerReview\":40}"), dev)
                .andExpect(status().isCreated())).get("id").asLong();
        call(post("/payments/deposit/" + id), dev).andExpect(status().isCreated());
        call(post("/projects/" + id + "/assign"), rev).andExpect(status().isOk());
        long fb = read(call(post("/api/v1/feedback/project/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":1,\"comment\":\"asdf\"}"), rev)
                .andExpect(status().isCreated())).get("id").asLong();

        assertEquals("REJECTED", read(call(post("/api/v1/feedback/" + fb + "/reject"), dev)
                .andExpect(status().isOk())).get("status").asText());
        assertEquals(0, read(call(get("/wallet"), rev)).get("balance").asInt());
    }

    @Test
    void validationErrorsAreClientErrors() throws Exception {
        String dev = signUp("DEVELOPER");
        call(post("/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectName\":\"\",\"description\":\"D\",\"reviewersNeeded\":1,\"payPerReview\":5}"), dev)
                .andExpect(status().isBadRequest());
        call(post("/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectName\":\"N\",\"description\":\"D\",\"projectLink\":\"http://plain.example\","
                        + "\"reviewersNeeded\":1,\"payPerReview\":5}"), dev)
                .andExpect(status().isBadRequest());
        call(post("/projects").contentType(MediaType.APPLICATION_JSON).content("{not json"), dev)
                .andExpect(status().isBadRequest());
        call(get("/projects/999999"), dev).andExpect(status().isNotFound());
    }

    @Test
    void demoLoginsWork() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"developer@demo.dev\",\"password\":\"Demo@1234\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"developer@demo.dev\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }
}
