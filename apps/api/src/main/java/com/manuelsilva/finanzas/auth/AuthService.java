package com.manuelsilva.finanzas.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

import com.manuelsilva.finanzas.auth.AuthDtos.AuthResponse;
import com.manuelsilva.finanzas.auth.AuthDtos.LoginRequest;
import com.manuelsilva.finanzas.auth.AuthDtos.RegisterRequest;
import com.manuelsilva.finanzas.auth.AuthDtos.UserResponse;
import com.manuelsilva.finanzas.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;
    private final JdbcTemplate jdbc;
    private final Duration refreshTtl;

    public AuthService(UserRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder,
                       JwtService jwt,
                       JdbcTemplate jdbc,
                       @Value("${app.jwt.refresh-ttl}") Duration refreshTtl) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
        this.jdbc = jdbc;
        this.refreshTtl = refreshTtl;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("DUPLICATE_EMAIL", "Ya existe un usuario con ese email.");
        }
        String currency = request.baseCurrency() == null ? "UYU" : request.baseCurrency();
        String locale = request.locale() == null ? "es-UY" : request.locale();
        User user = new User(email, passwordEncoder.encode(request.password()), request.name().trim(), currency, locale);
        users.saveAndFlush(user);
        // Las categorías por defecto se crean en la misma transacción (ver V2__seed_monedas_y_categorias.sql).
        jdbc.queryForObject("SELECT seed_default_categories(?)", Object.class, user.getId());
        return issueSession(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmail(normalizeEmail(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("INVALID_CREDENTIALS", "Email o contraseña incorrectos."));
        return issueSession(user);
    }

    /**
     * Rota el refresh token. Reusar uno ya rotado revoca todas las sesiones del usuario.
     * noRollbackFor: el 401 por reuso debe confirmar la revocación; sin esto, Spring la revertiría.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse refresh(String rawToken) {
        Instant now = Instant.now();
        RefreshToken current = refreshTokens.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> invalidRefresh());
        if (current.isRevoked()) {
            refreshTokens.revokeAllForUser(current.getUserId(), now);
            throw invalidRefresh();
        }
        if (current.isExpired(now)) {
            throw invalidRefresh();
        }
        current.revoke(now);
        User user = users.findById(current.getUserId()).orElseThrow(AuthService::invalidRefresh);
        return issueSession(user);
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokens.findByTokenHash(hash(rawToken)).ifPresent(t -> t.revoke(Instant.now()));
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("UNAUTHORIZED", "El usuario ya no existe."));
        return toResponse(user);
    }

    private AuthResponse issueSession(User user) {
        Instant now = Instant.now();
        String refresh = newRefreshToken();
        refreshTokens.save(new RefreshToken(user.getId(), hash(refresh), now.plus(refreshTtl)));
        String access = jwt.issueAccessToken(user.getId(), user.getEmail(), now);
        return new AuthResponse(access, refresh, "Bearer", jwt.accessTtlSeconds(), toResponse(user));
    }

    static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getBaseCurrency(), user.getLocale());
    }

    private static ApiException invalidRefresh() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_INVALID",
                "El refresh token está vencido o fue revocado.");
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String newRefreshToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** SHA-256 en hexadecimal: el token en claro nunca se guarda. */
    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 no disponible", ex);
        }
    }
}
