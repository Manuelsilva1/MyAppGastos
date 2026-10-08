package com.manuelsilva.finanzas.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manuelsilva.finanzas.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.http.MediaType;

class AuthIT extends IntegrationTestBase {

    private static final String PASSWORD = "clave-de-prueba-123";

    @Autowired
    private ObjectMapper json;

    @Test
    void registroDevuelveSesionYCreaCategoriasPorDefecto() throws Exception {
        JsonNode body = register("reg-" + UUID.randomUUID() + "@test.com");

        assertThat(body.get("accessToken").asText()).isNotBlank();
        assertThat(body.get("refreshToken").asText()).isNotBlank();
        assertThat(body.get("tokenType").asText()).isEqualTo("Bearer");
        String userId = body.get("user").get("id").asText();
        Integer categorias = jdbc.queryForObject(
                "SELECT count(*) FROM categories WHERE user_id = ?::uuid", Integer.class, userId);
        assertThat(categorias).isEqualTo(15);
    }

    @Test
    void emailDuplicadoDevuelve409() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@test.com";
        register(email);
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(email.toUpperCase())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"));
    }

    @Test
    void loginConClaveIncorrectaDevuelve401() throws Exception {
        String email = "login-" + UUID.randomUUID() + "@test.com";
        register(email);
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"otra-clave-incorrecta\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void refreshRotaYReusarUnTokenRevocaLaSesion() throws Exception {
        JsonNode first = register("rot-" + UUID.randomUUID() + "@test.com");
        String refresh1 = first.get("refreshToken").asText();

        JsonNode second = refresh(refresh1);
        String refresh2 = second.get("refreshToken").asText();
        assertThat(refresh2).isNotEqualTo(refresh1);

        // Reusar el token ya rotado: 401 y la sesión completa queda revocada.
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh1 + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("REFRESH_TOKEN_INVALID"));
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh2 + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meRequiereTokenYDevuelveElUsuario() throws Exception {
        JsonNode body = register("me-" + UUID.randomUUID() + "@test.com");
        mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + body.get("accessToken").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(body.get("user").get("email").asText()));
    }

    private JsonNode register(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode refresh(String token) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + token + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    private String registerJson(String email) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"name\":\"Prueba\","
                + "\"baseCurrency\":\"UYU\",\"locale\":\"es-UY\"}";
    }
}
