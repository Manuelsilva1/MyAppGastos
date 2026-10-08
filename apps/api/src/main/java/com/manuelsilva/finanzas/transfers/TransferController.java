package com.manuelsilva.finanzas.transfers;

import java.util.UUID;

import com.manuelsilva.finanzas.transactions.TransactionDtos.VoidRequest;
import com.manuelsilva.finanzas.transfers.TransferDtos.TransferCreateRequest;
import com.manuelsilva.finanzas.transfers.TransferDtos.TransferResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${app.base-path}/transfers")
public class TransferController {

    private final TransferService transfers;

    public TransferController(TransferService transfers) {
        this.transfers = transfers;
    }

    @PostMapping
    ResponseEntity<TransferResponse> create(@AuthenticationPrincipal UUID userId,
                                            @Valid @RequestBody TransferCreateRequest request) {
        TransferService.CreateResult result = transfers.create(userId, request);
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(result.transfer());
    }

    @PostMapping("/{transferId}/void")
    TransferResponse voidTransfer(@AuthenticationPrincipal UUID userId, @PathVariable UUID transferId,
                                  @Valid @RequestBody VoidRequest request) {
        return transfers.voidTransfer(userId, transferId, request);
    }
}
