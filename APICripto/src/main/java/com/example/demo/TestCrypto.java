package com.example.demo;

import java.math.BigDecimal;

public class TestCrypto {
    public static void main(String[] args) {
        try {
            // Nombre de la criptomoneda y cantidad a convertir
            String nombreCripto = "bitcoin";
            BigDecimal cantidad = new BigDecimal("0.5");

            // Obtener el precio en USD de la criptomoneda
            BigDecimal precioCripto = CriptoPriceService.obtenerPrecio(nombreCripto);
            System.out.println("Precio actual de " + nombreCripto + ": $" + precioCripto);

            // Convertir la cantidad de criptomonedas a fiat
            BigDecimal montoFiat = CriptoConverter.convertirCriptoAFiat(cantidad, precioCripto);
            System.out.println(cantidad + " " + nombreCripto + " = $" + montoFiat);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
