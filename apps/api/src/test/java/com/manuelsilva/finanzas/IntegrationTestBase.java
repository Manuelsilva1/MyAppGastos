package com.manuelsilva.finanzas;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base de los tests de integración con PostgreSQL real y las migraciones Flyway.
 * Con Docker levanta un contenedor (Testcontainers). Sin Docker, usa la base de
 * TEST_DB_URL / TEST_DB_USER / TEST_DB_PASSWORD.
 */
@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@AutoConfigureMockMvc
public abstract class IntegrationTestBase {

    static final PostgreSQLContainer<?> POSTGRES =
            System.getenv("TEST_DB_URL") == null ? new PostgreSQLContainer<>("postgres:16-alpine") : null;

    static {
        if (POSTGRES != null) {
            POSTGRES.start();
        }
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        if (POSTGRES != null) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
        } else {
            registry.add("spring.datasource.url", () -> System.getenv("TEST_DB_URL"));
            registry.add("spring.datasource.username", () -> System.getenv("TEST_DB_USER"));
            registry.add("spring.datasource.password", () -> System.getenv("TEST_DB_PASSWORD"));
        }
    }

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected ObjectMapper json;

    /** Usuario nuevo registrado por la API: token, id y categorías por defecto creadas. */
    protected record Session(String token, UUID userId) {
        public String auth() {
            return "Bearer " + token;
        }
    }

    protected Session newSession() throws Exception {
        String email = "t-" + UUID.randomUUID() + "@test.com";
        MvcResult result = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"clave-de-prueba-123\",\"name\":\"Prueba\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        return new Session(body.get("accessToken").asText(), UUID.fromString(body.get("user").get("id").asText()));
    }

    /** Crea una cuenta vía API y devuelve su id. */
    protected UUID createAccount(Session s, String name, String currency, String initial) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/accounts")
                        .header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"type\":\"BANK\",\"currency\":\"" + currency
                                + "\",\"initialBalance\":\"" + initial + "\",\"initialBalanceDate\":\"2026-01-01\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    /** Id de una categoría por defecto del usuario (raíz, del tipo indicado). */
    protected UUID defaultCategory(Session s, String name, String kind) {
        return jdbc.queryForObject(
                "SELECT id FROM categories WHERE user_id = ? AND name = ? AND kind = ? AND parent_id IS NULL",
                UUID.class, s.userId(), name, kind);
    }
}
