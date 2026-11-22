package com.feedback.feedbackplatform;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.admin.email=Boss@Test.Dev",
        "app.admin.password=boss-password-1"
})
@AutoConfigureMockMvc
class AdminBootstrapTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void adminFromEnvCanLogInAndReachAdminEndpoints() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"boss@test.dev\",\"password\":\"boss-password-1\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var login = json.readTree(body);
        assertEquals("ADMIN", login.get("role").asText());

        mvc.perform(get("/admin/feedbacks/pending")
                        .header("Authorization", "Bearer " + login.get("token").asText()))
                .andExpect(status().isOk());
    }

    @Test
    void developersStillCannotReachAdminEndpoints() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"developer@demo.dev\",\"password\":\"Demo@1234\"}"))
                .andExpect(status().isOk());
        String token = json.readTree(mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"developer@demo.dev\",\"password\":\"Demo@1234\"}"))
                .andReturn().getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get("/admin/feedbacks/pending").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
