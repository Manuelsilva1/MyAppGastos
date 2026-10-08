package com.manuelsilva.finanzas.transfers;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferRepository extends JpaRepository<Transfer, UUID> {

    Optional<Transfer> findByIdAndUserId(UUID id, UUID userId);
}
