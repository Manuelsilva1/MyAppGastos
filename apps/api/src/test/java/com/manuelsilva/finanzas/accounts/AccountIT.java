package com.manuelsilva.finanzas.accounts;

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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class AccountIT extends IntegrationTestBase {

    @Autowired
    private ObjectMapper json;

    @Test
    void creaCuentaConSaldoInicialComoString() throws Exception {
        Session s = session();
        JsonNode account = createAccount(s, "Santander", "1000.50");

        assertThat(account.get("initialBalance").asText()).isEqualTo("1000.5000");
        assertThat(account.get("balance").asText()).isEqualTo("1000.5000");
        assertThat(account.get("currency").asText()).isEqualTo("UYU");
    }

    @Test
    void saldoSeDeriveDeMovimientosNoAnulados() throws Exception {
        Session s = session();
        JsonNode account = createAccount(s, "Caja", "1000");
        String accountId = account.get("id").asText();
        String categoryId = jdbc.queryForObject(
                "SELECT id::text FROM categories WHERE user_id = ?::uuid AND name = 'Supermercado' AND kind = 'EXPENSE' AND parent_id IS NULL",
                String.class, s.userId);

        // Gasto de 100.50 vigente y gasto de 50 anulado: solo el primero cuenta.
        jdbc.update("""
                INSERT INTO transactions (id, user_id, account_id, type, amount, category_id, occurred_on)
                VALUES (?::uuid, ?::uuid, ?::uuid, 'EXPENSE', -100.5000, ?::uuid, CURRENT_DATE)""",
                UUID.randomUUID(), s.userId, accountId, categoryId);
        jdbc.update("""
                INSERT INTO transactions (id, user_id, account_id, type, amount, category_id, occurred_on, voided_at, void_reason)
                VALUES (?::uuid, ?::uuid, ?::uuid, 'EXPENSE', -50.0000, ?::uuid, CURRENT_DATE, now(), 'error')""",
                UUID.randomUUID(), s.userId, accountId, categoryId);

        mvc.perform(get("/api/v1/accounts/" + accountId).header("Authorization", "Bearer " + s.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value("899.5000"));
    }

    @Test
    void nombreActivoDuplicadoDevuelve409() throws Exception {
        Session s = session();
        createAccount(s, "Efectivo", "0");
        mvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + s.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(accountJson("Efectivo", "UYU", "0")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_NAME"));
    }

    @Test
    void monedaNoSoportadaDevuelve422() throws Exception {
        Session s = session();
        mvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + s.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(accountJson("Cripto", "XXX", "0")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("DOMAIN_RULE_VIOLATION"));
    }

    @Test
    void montoConMasDeCuatroDecimalesEsInvalido() throws Exception {
        Session s = session();
        mvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + s.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(accountJson("Mal", "UYU", "1.23456")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void cuentaDeOtroUsuarioDevuelve404() throws Exception {
        Session owner = session();
        Session other = session();
        String accountId = createAccount(owner, "Privada", "10").get("id").asText();
        mvc.perform(get("/api/v1/accounts/" + accountId).header("Authorization", "Bearer " + other.token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mvc.perform(get("/api/v1/accounts")).andExpect(status().isUnauthorized());
    }

    private JsonNode createAccount(Session s, String name, String initial) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/accounts")
                        .header("Authorization", "Bearer " + s.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(accountJson(name, "UYU", initial)))
                .andExpect(status().isCreated())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    private static String accountJson(String name, String currency, String initial) {
        return "{\"name\":\"" + name + "\",\"type\":\"BANK\",\"currency\":\"" + currency + "\","
                + "\"initialBalance\":\"" + initial + "\",\"initialBalanceDate\":\"2026-01-01\"}";
    }

    /** Usuario nuevo con token y categorías por defecto. */
    private Session session() throws Exception {
        String email = "acc-" + UUID.randomUUID() + "@test.com";
        MvcResult result = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"clave-de-prueba-123\",\"name\":\"Prueba\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        return new Session(body.get("accessToken").asText(), UUID.fromString(body.get("user").get("id").asText()));
    }

    private record Session(String token, UUID userId) {
    }
}
