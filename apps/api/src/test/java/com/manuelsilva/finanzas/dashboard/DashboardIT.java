package com.manuelsilva.finanzas.dashboard;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import com.manuelsilva.finanzas.IntegrationTestBase;
import org.junit.jupiter.api.Test;

class DashboardIT extends IntegrationTestBase {

    @Test
    void patrimonioConvierteLaMonedaConLaCotizacionMasReciente() throws Exception {
        Session s = newSession();
        createAccount(s, "Caja", "UYU", "1000");
        createAccount(s, "Ahorro", "USD", "100");
        jdbc.update("""
                INSERT INTO exchange_rates (user_id, from_currency, to_currency, rate, rate_date, source)
                VALUES (?, 'USD', 'UYU', 40.00000000, ?, 'MANUAL')""", s.userId(), LocalDate.now().minusDays(2));

        mvc.perform(get("/api/v1/dashboard?month=2026-10").header("Authorization", s.auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseCurrency").value("UYU"))
                .andExpect(jsonPath("$.netWorth.amount").value("5000.0000"))
                .andExpect(jsonPath("$.missingRates.length()").value(0))
                .andExpect(jsonPath("$.accounts.length()").value(2));
    }

    @Test
    void cuentaSinCotizacionNoSeSumaYSeReporta() throws Exception {
        Session s = newSession();
        createAccount(s, "Caja", "UYU", "1000");
        UUID usd = createAccount(s, "Ahorro", "USD", "100");

        mvc.perform(get("/api/v1/dashboard").header("Authorization", s.auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.netWorth.amount").value("1000.0000"))
                .andExpect(jsonPath("$.missingRates[0].accountId").value(usd.toString()))
                .andExpect(jsonPath("$.missingRates[0].currency").value("USD"));
    }

    @Test
    void mesMalFormadoDevuelve422() throws Exception {
        Session s = newSession();
        mvc.perform(get("/api/v1/dashboard?month=2026-13").header("Authorization", s.auth()))
                .andExpect(status().isUnprocessableEntity());
    }
}
