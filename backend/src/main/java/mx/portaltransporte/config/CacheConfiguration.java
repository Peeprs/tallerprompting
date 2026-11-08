package mx.portaltransporte.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Actor: sistema acelera la tabla de clientes sin repetir el descifrado.
// Cache de aplicacion. Tecnica: cache-aside con TTL de 5 min y eviccion explicita al mutar.
@Configuration @EnableCaching
public class CacheConfiguration {
 // Cache de filas de clientes y talleres. Tecnica: TTL corto, nunca errores, eviccion por evento.
 @Bean CacheManager cacheManager() {
  CaffeineCacheManager manager = new CaffeineCacheManager("clientRows", "workshopRows");
  manager.setCaffeine(Caffeine.newBuilder().expireAfterWrite(5, TimeUnit.MINUTES).maximumSize(500));
  return manager;
 }
}
