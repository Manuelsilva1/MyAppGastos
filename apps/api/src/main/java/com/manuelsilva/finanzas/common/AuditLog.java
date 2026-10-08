package com.manuelsilva.finanzas.common;

import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Escribe en audit_log (append-only): quién, cuándo, valor anterior y nuevo. */
@Component
public class AuditLog {

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public AuditLog(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public void record(UUID userId, String entityType, UUID entityId, String action, Object before, Object after) {
        jdbc.update("""
                INSERT INTO audit_log (user_id, entity_type, entity_id, action, before, after)
                VALUES (?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb))""",
                userId, entityType, entityId, action, toJson(before), toJson(after));
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return json.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("No se pudo serializar la auditoría", ex);
        }
    }
}
