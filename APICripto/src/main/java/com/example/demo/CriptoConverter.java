package com.example.demo;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class CriptoConverter {

    /**
     * Convierte un monto de criptomoneda a fiat.
     *
     * @param montoCripto cantidad de criptomoneda
     * @param precioCripto precio actual de la criptomoneda en fiat
     * @return equivalente en moneda fiat
     * @throws IllegalArgumentException si los valores son nulos o negativos
     */
    public static BigDecimal convertirCriptoAFiat(BigDecimal montoCripto, BigDecimal precioCripto) {
        if (montoCripto == null || precioCripto == null) {
            throw new IllegalArgumentException("Monto o precio no pueden ser nulos");
        }

        if (montoCripto.compareTo(BigDecimal.ZERO) < 0 || precioCripto.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Monto o precio no pueden ser negativos");
        }

        BigDecimal montoFiat = montoCripto.multiply(precioCripto);
        montoFiat = montoFiat.setScale(2, RoundingMode.HALF_UP); // Redondea a 2 decimales

        return montoFiat;
    }
}
