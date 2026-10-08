package com.manuelsilva.finanzas.transactions;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.manuelsilva.finanzas.transactions.TransactionDtos.TransactionCreateRequest;
import com.manuelsilva.finanzas.transactions.TransactionDtos.TransactionPage;
import com.manuelsilva.finanzas.transactions.TransactionDtos.TransactionResponse;
import com.manuelsilva.finanzas.transactions.TransactionDtos.VoidRequest;
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
@RequestMapping("${app.base-path}/transactions")
public class TransactionController {

    private final TransactionService transactions;

    public TransactionController(TransactionService transactions) {
        this.transactions = transactions;
    }

    /** 201 si se creó; 200 con el original si era un reintento idéntico (cola offline). */
    @PostMapping
    ResponseEntity<TransactionResponse> create(@AuthenticationPrincipal UUID userId,
                                               @Valid @RequestBody TransactionCreateRequest request) {
        TransactionService.CreateResult result = transactions.create(userId, request);
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(result.transaction());
    }

    @GetMapping
    TransactionPage list(@AuthenticationPrincipal UUID userId,
                         @RequestParam(required = false) LocalDate from,
                         @RequestParam(required = false) LocalDate to,
                         @RequestParam(required = false) UUID accountId,
                         @RequestParam(required = false) UUID categoryId,
                         @RequestParam(required = false) List<TransactionType> type,
                         @RequestParam(required = false) String q,
                         @RequestParam(defaultValue = "false") boolean includeVoided,
                         @RequestParam(required = false) Integer limit,
                         @RequestParam(required = false) String cursor) {
        return transactions.list(userId, from, to, accountId, categoryId, type, q, includeVoided, limit, cursor);
    }

    @PostMapping("/{transactionId}/void")
    TransactionResponse voidTransaction(@AuthenticationPrincipal UUID userId,
                                        @PathVariable UUID transactionId,
                                        @Valid @RequestBody VoidRequest request) {
        return transactions.voidTransaction(userId, transactionId, request);
    }
}
