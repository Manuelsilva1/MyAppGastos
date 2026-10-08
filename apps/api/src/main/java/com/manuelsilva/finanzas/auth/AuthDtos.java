package com.manuelsilva.finanzas.auth;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 128) String password,
            @NotBlank @Size(max = 100) String name,
            @Pattern(regexp = "^[A-Z]{3}$") String baseCurrency,
            @Size(max = 16) String locale) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record UserResponse(UUID id, String email, String name, String baseCurrency, String locale) {
    }

    public record AuthResponse(String accessToken, String refreshToken, String tokenType, long expiresIn,
                               UserResponse user) {
    }
}
