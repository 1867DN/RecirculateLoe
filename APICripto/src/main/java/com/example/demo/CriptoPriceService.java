package com.example.demo;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

public class CriptoPriceService {

    private static final String API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=%s&vs_currencies=usd";
    private static final String CACHE_FILE = "cripto_cache.json";

    private static Map<String, BigDecimal> cache = new HashMap<>();

    static {
        // Cargar cache desde archivo al iniciar
        loadCache();
    }

    public static BigDecimal obtenerPrecio(String nombreCripto) throws Exception {
        String criptoKey = nombreCripto.toLowerCase();
        try {
            String urlStr = String.format(API_URL, criptoKey);
            HttpURLConnection connection = (HttpURLConnection) new URL(urlStr).openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            try (InputStreamReader reader = new InputStreamReader(connection.getInputStream())) {
                Gson gson = new Gson();
                JsonObject response = gson.fromJson(reader, JsonObject.class);
                JsonObject criptoData = response.getAsJsonObject(criptoKey);

                if (criptoData != null) {
                    BigDecimal precio = criptoData.get("usd").getAsBigDecimal();
                    cache.put(criptoKey, precio);
                    saveCache();
                    return precio;
                } else {
                    throw new Exception("Criptomoneda no encontrada en la API.");
                }
            }
        } catch (Exception e) {
            // Si falla la API, usar cache local
            if (cache.containsKey(criptoKey)) {
                System.out.println("No se pudo conectar a la API. Usando valor almacenado en cache.");
                return cache.get(criptoKey);
            } else {
                throw new Exception("No se pudo obtener el precio y no hay valor en cache.", e);
            }
        }
    }


    private static void loadCache() {
        try {
            File file = new File(CACHE_FILE);
            if (file.exists()) {
                Gson gson = new Gson();
                cache = gson.fromJson(new FileReader(file), new TypeToken<Map<String, BigDecimal>>() {}.getType());
            }
        } catch (Exception e) {
            System.out.println("No se pudo cargar la cache: " + e.getMessage());
            cache = new HashMap<>();
        }
    }

    private static void saveCache() {
        try (FileWriter writer = new FileWriter(CACHE_FILE)) {
            new Gson().toJson(cache, writer);
        } catch (Exception e) {
            System.out.println("No se pudo guardar la cache: " + e.getMessage());
        }
    }
}
