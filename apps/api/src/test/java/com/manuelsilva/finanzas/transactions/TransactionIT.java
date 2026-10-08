package com.manuelsilva.finanzas.transactions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.manuelsilva.finanzas.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class TransactionIT extends IntegrationTestBase {

    @Test
    void altaCreaUnGastoConMontoNegativoYReintentoIdenticoNoDuplica() throws Exception {
        Session s = newSession();
        UUID account = createAccount(s, "Caja", "UYU", "1000");
        UUID txId = UUID.randomUUID();
        String body = expenseJson(txId, account, s, "450.00");

        mvc.perform(post("/api/v1/transactions").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value("-450.0000"));

        // Reintento de la cola offline: mismo id y mismo contenido.
        mvc.perform(post("/api/v1/transactions").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(txId.toString()));

        Integer count = jdbc.queryForObject("SELECT count(*) FROM transactions WHERE id = ?", Integer.class, txId);
        assertThat(count).isEqualTo(1);
    }

    @Test
    void mismoIdConOtroContenidoDevuelve409SinSobrescribir() throws Exception {
        Session s = newSession();
        UUID account = createAccount(s, "Caja", "UYU", "1000");
        UUID txId = UUID.randomUUID();
        mvc.perform(post("/api/v1/transactions").header("Authorization", s.auth())
                .contentType(MediaType.APPLICATION_JSON).content(expenseJson(txId, account, s, "450.00")));

        mvc.perform(post("/api/v1/transactions").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content(expenseJson(txId, account, s, "999.00")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ID_REUSED_WITH_DIFFERENT_PAYLOAD"));
        assertThat(jdbc.queryForObject("SELECT amount FROM transactions WHERE id = ?", java.math.BigDecimal.class, txId))
                .isEqualByComparingTo("-450");
    }

    @Test
    void mismoIdDeOtroUsuarioDevuelve409() throws Exception {
        Session owner = newSession();
        Session other = newSession();
        UUID txId = UUID.randomUUID();
        mvc.perform(post("/api/v1/transactions").header("Authorization", owner.auth())
                .contentType(MediaType.APPLICATION_JSON)
                .content(expenseJson(txId, createAccount(owner, "Caja", "UYU", "0"), owner, "10")));

        mvc.perform(post("/api/v1/transactions").header("Authorization", other.auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(expenseJson(txId, createAccount(other, "Caja", "UYU", "0"), other, "10")))
                .andExpect(status().isConflict());
    }

    @Test
    void categoriaDeOtroTipoEsRechazada() throws Exception {
        Session s = newSession();
        UUID account = createAccount(s, "Caja", "UYU", "0");
        String body = "{\"id\":\"" + UUID.randomUUID() + "\",\"accountId\":\"" + account + "\",\"type\":\"EXPENSE\","
                + "\"amount\":\"10\",\"categoryId\":\"" + defaultCategory(s, "Sueldo", "INCOME") + "\",\"occurredOn\":\"2026-10-07\"}";
        mvc.perform(post("/api/v1/transactions").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("DOMAIN_RULE_VIOLATION"));
    }

    @Test
    void listadoKeysetPagina() throws Exception {
        Session s = newSession();
        UUID account = createAccount(s, "Caja", "UYU", "0");
        for (int day = 1; day <= 3; day++) {
            String body = "{\"id\":\"" + UUID.randomUUID() + "\",\"accountId\":\"" + account + "\",\"type\":\"EXPENSE\","
                    + "\"amount\":\"10\",\"categoryId\":\"" + defaultCategory(s, "Ocio", "EXPENSE")
                    + "\",\"occurredOn\":\"2026-10-0" + day + "\"}";
            mvc.perform(post("/api/v1/transactions").header("Authorization", s.auth())
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated());
        }

        MvcResult first = mvc.perform(get("/api/v1/transactions?limit=2").header("Authorization", s.auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].occurredOn").value("2026-10-03"))
                .andReturn();
        String cursor = json.readTree(first.getResponse().getContentAsString()).get("nextCursor").asText();

        mvc.perform(get("/api/v1/transactions?limit=2&cursor=" + cursor).header("Authorization", s.auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].occurredOn").value("2026-10-01"))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void anulacionSacaElMovimientoDelSaldoYDelListado() throws Exception {
        Session s = newSession();
        UUID account = createAccount(s, "Caja", "UYU", "1000");
        UUID txId = UUID.randomUUID();
        mvc.perform(post("/api/v1/transactions").header("Authorization", s.auth())
                .contentType(MediaType.APPLICATION_JSON).content(expenseJson(txId, account, s, "100.50")));

        mvc.perform(post("/api/v1/transactions/" + txId + "/void").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":5,\"reason\":\"x\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));

        mvc.perform(post("/api/v1/transactions/" + txId + "/void").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"reason\":\"error\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.voidedAt").isNotEmpty());

        mvc.perform(post("/api/v1/transactions/" + txId + "/void").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
                .andExpect(status().isUnprocessableEntity());

        mvc.perform(get("/api/v1/accounts/" + account).header("Authorization", s.auth()))
                .andExpect(jsonPath("$.balance").value("1000.0000"));
        mvc.perform(get("/api/v1/transactions").header("Authorization", s.auth()))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    private String expenseJson(UUID id, UUID account, Session s, String amount) {
        return "{\"id\":\"" + id + "\",\"accountId\":\"" + account + "\",\"type\":\"EXPENSE\",\"amount\":\"" + amount
                + "\",\"categoryId\":\"" + defaultCategory(s, "Supermercado", "EXPENSE") + "\",\"occurredOn\":\"2026-10-07\"}";
    }
}
