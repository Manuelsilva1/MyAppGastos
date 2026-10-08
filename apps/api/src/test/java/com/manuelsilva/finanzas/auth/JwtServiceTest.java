package com.manuelsilva.finanzas.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "secreto-de-prueba-con-al-menos-32-bytes-0123456789";

    private final JwtService jwt = new JwtService(SECRET, Duration.ofMinutes(15));

    @Test
    void tokenValidoDevuelveElUsuario() {
        UUID userId = UUID.randomUUID();
        String token = jwt.issueAccessToken(userId, "a@b.com", Instant.now());
        assertThat(jwt.parseUserId(token)).contains(userId);
    }

    @Test
    void tokenVencidoSeRechaza() {
        String token = jwt.issueAccessToken(UUID.randomUUID(), "a@b.com", Instant.now().minus(Duration.ofHours(1)));
        assertThat(jwt.parseUserId(token)).isEmpty();
    }

    @Test
    void firmaAlteradaSeRechaza() {
        String token = jwt.issueAccessToken(UUID.randomUUID(), "a@b.com", Instant.now());
        String[] parts = token.split("\\.");
        char original = parts[2].charAt(5);
        String signature = parts[2].substring(0, 5) + (original == 'A' ? 'B' : 'A') + parts[2].substring(6);
        assertThat(jwt.parseUserId(parts[0] + "." + parts[1] + "." + signature)).isEmpty();
    }

    @Test
    void tokenFirmadoConOtraClaveSeRechaza() {
        String token = new JwtService("otra-clave-distinta-de-32-bytes-abcdef", Duration.ofMinutes(15))
                .issueAccessToken(UUID.randomUUID(), "a@b.com", Instant.now());
        assertThat(jwt.parseUserId(token)).isEmpty();
    }

    @Test
    void secretoCortoNoArranca() {
        assertThatThrownBy(() -> new JwtService("corto", Duration.ofMinutes(15)))
                .isInstanceOf(IllegalStateException.class);
    }
}
