package com.manuelsilva.finanzas.accounts;

import java.util.UUID;

import com.manuelsilva.finanzas.accounts.AccountDtos.AccountCreateRequest;
import com.manuelsilva.finanzas.accounts.AccountDtos.AccountListResponse;
import com.manuelsilva.finanzas.accounts.AccountDtos.AccountResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${app.base-path}/accounts")
public class AccountController {

    private final AccountService accounts;

    public AccountController(AccountService accounts) {
        this.accounts = accounts;
    }

    @GetMapping
    AccountListResponse list(@AuthenticationPrincipal UUID userId,
                             @RequestParam(defaultValue = "false") boolean includeArchived) {
        return accounts.list(userId, includeArchived);
    }

    @PostMapping
    ResponseEntity<AccountResponse> create(@AuthenticationPrincipal UUID userId,
                                           @Valid @RequestBody AccountCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accounts.create(userId, request));
    }

    @GetMapping("/{accountId}")
    AccountResponse get(@AuthenticationPrincipal UUID userId, @PathVariable UUID accountId) {
        return accounts.get(userId, accountId);
    }
}
