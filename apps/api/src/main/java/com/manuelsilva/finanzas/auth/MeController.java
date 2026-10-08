package com.manuelsilva.finanzas.auth;

import java.util.UUID;

import com.manuelsilva.finanzas.auth.AuthDtos.UserResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${app.base-path}")
public class MeController {

    private final AuthService auth;

    public MeController(AuthService auth) {
        this.auth = auth;
    }

    @GetMapping("/me")
    UserResponse me(@AuthenticationPrincipal UUID userId) {
        return auth.me(userId);
    }
}
