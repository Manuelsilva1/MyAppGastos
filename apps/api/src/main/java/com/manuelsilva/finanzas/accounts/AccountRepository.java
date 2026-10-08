package com.manuelsilva.finanzas.accounts;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByIdAndUserId(UUID id, UUID userId);

    List<Account> findByUserIdOrderBySortOrderAscNameAsc(UUID userId);

    boolean existsByUserIdAndNameAndArchivedAtIsNull(UUID userId, String name);
}
