package com.manuelsilva.finanzas.transfers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.manuelsilva.finanzas.IntegrationTestBase;
import com.manuelsilva.finanzas.transactions.Transaction;
import com.manuelsilva.finanzas.transactions.TransactionRepository;
import com.manuelsilva.finanzas.transactions.TransactionType;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.http.MediaType;

class TransferIT extends IntegrationTestBase {

    @MockitoSpyBean
    TransactionRepository transactionRepository;

    @Test
    void transferenciaMismaMonedaMueveElSaldoConDosMovimientos() throws Exception {
        Session s = newSession();
        UUID from = createAccount(s, "Banco", "UYU", "5000");
        UUID to = createAccount(s, "Efectivo", "UYU", "0");

        transfer(s, UUID.randomUUID(), from, to, "1200.00", "1200.00", null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.exchangeRate").doesNotExist());

        mvc.perform(get("/api/v1/accounts/" + from).header("Authorization", s.auth()))
                .andExpect(jsonPath("$.balance").value("3800.0000"));
        mvc.perform(get("/api/v1/accounts/" + to).header("Authorization", s.auth()))
                .andExpect(jsonPath("$.balance").value("1200.0000"));
    }

    @Test
    void transferenciaEntreMonedasGuardaMontosYTipoDeCambio() throws Exception {
        Session s = newSession();
        UUID uyu = createAccount(s, "Banco", "UYU", "40125");
        UUID usd = createAccount(s, "Ahorro", "USD", "0");

        transfer(s, UUID.randomUUID(), uyu, usd, "40125.00", "1000.00", "40.12500000")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.exchangeRate").value("40.12500000"));
        mvc.perform(get("/api/v1/accounts/" + usd).header("Authorization", s.auth()))
                .andExpect(jsonPath("$.balance").value("1000.0000"));
    }

    @Test
    void mismaMonedaConTipoDeCambioEsInvalida() throws Exception {
        Session s = newSession();
        UUID a = createAccount(s, "A", "UYU", "100");
        UUID b = createAccount(s, "B", "UYU", "0");
        transfer(s, UUID.randomUUID(), a, b, "10", "10", "1")
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void mismaCuentaEsInvalida() throws Exception {
        Session s = newSession();
        UUID a = createAccount(s, "A", "UYU", "100");
        transfer(s, UUID.randomUUID(), a, a, "10", "10", null)
                .andExpect(status().isUnprocessableEntity());
    }

    /**
     * Atomicidad: si falla la pata de entrada, no queda cabecera ni la pata de salida.
     * Se fuerza el error al guardar el TRANSFER_IN y se verifica que todo se revirtió.
     */
    @Test
    void siFallaLaPataDeEntradaNoQuedaNadaAMedias() throws Exception {
        Session s = newSession();
        UUID from = createAccount(s, "Banco", "UYU", "5000");
        UUID to = createAccount(s, "Efectivo", "UYU", "0");
        UUID transferId = UUID.randomUUID();
        doThrow(new IllegalStateException("fallo simulado"))
                .when(transactionRepository)
                .saveAndFlush(argThat((Transaction tx) -> tx.getType() == TransactionType.TRANSFER_IN));

        assertThatThrownBy(() -> transfer(s, transferId, from, to, "700.00", "700.00", null))
                .hasRootCauseInstanceOf(IllegalStateException.class);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM transfers WHERE id = ?", Integer.class, transferId)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM transactions WHERE transfer_id = ?", Integer.class, transferId)).isZero();
        mvc.perform(get("/api/v1/accounts/" + from).header("Authorization", s.auth()))
                .andExpect(jsonPath("$.balance").value("5000.0000"));
    }

    @Test
    void anularTransferenciaAnulaAmbasPatasYRestauraSaldos() throws Exception {
        Session s = newSession();
        UUID from = createAccount(s, "Banco", "UYU", "5000");
        UUID to = createAccount(s, "Efectivo", "UYU", "0");
        UUID transferId = UUID.randomUUID();
        transfer(s, transferId, from, to, "1200.00", "1200.00", null).andExpect(status().isCreated());

        mvc.perform(post("/api/v1/transfers/" + transferId + "/void").header("Authorization", s.auth())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"reason\":\"error\"}"))
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM transactions WHERE transfer_id = ? AND voided_at IS NULL", Integer.class, transferId))
                .isZero();
        mvc.perform(get("/api/v1/accounts/" + from).header("Authorization", s.auth()))
                .andExpect(jsonPath("$.balance").value("5000.0000"));
        mvc.perform(get("/api/v1/accounts/" + to).header("Authorization", s.auth()))
                .andExpect(jsonPath("$.balance").value("0.0000"));
    }

    private org.springframework.test.web.servlet.ResultActions transfer(Session s, UUID id, UUID from, UUID to,
                                                                        String fromAmount, String toAmount, String rate)
            throws Exception {
        String rateJson = rate == null ? "" : ",\"exchangeRate\":\"" + rate + "\"";
        return mvc.perform(post("/api/v1/transfers").header("Authorization", s.auth())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":\"" + id + "\",\"fromAccountId\":\"" + from + "\",\"toAccountId\":\"" + to
                        + "\",\"fromAmount\":\"" + fromAmount + "\",\"toAmount\":\"" + toAmount + "\"" + rateJson
                        + ",\"occurredOn\":\"2026-10-07\"}"));
    }
}
