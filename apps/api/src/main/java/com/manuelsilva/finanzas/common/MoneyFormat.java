package com.manuelsilva.finanzas.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Montos como string con 4 decimales, igual que NUMERIC(19,4) y el contrato de la API. */
public final class MoneyFormat {

    private MoneyFormat() {
    }

    public static String toApi(BigDecimal value) {
        return value.setScale(4, RoundingMode.UNNECESSARY).toPlainString();
    }

    public static BigDecimal parse(String value) {
        return new BigDecimal(value).setScale(4, RoundingMode.UNNECESSARY);
    }
}
