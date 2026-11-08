package mx.portaltransporte.observability;

import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.aop.ObservedAspect;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * Configuración transversal de observabilidad.
 * Actor: sistema. Técnica: Micrometer Observation + Micrometer Tracing (puente OTel) sin tocar la lógica de negocio.
 */
@Configuration
public class ObservabilityConfiguration {

    // Habilita @Observed en beans de servicio. Actor: sistema. Técnica: AOP mínimo y no invasivo.
    @Bean
    ObservedAspect observedAspect(ObservationRegistry registry) {
        return new ObservedAspect(registry);
    }

    // Etiqueta común de entorno en todas las métricas. Actor: sistema. Técnica: baja cardinalidad, sin ids.
    @Bean
    MeterRegistryCustomizer<MeterRegistry> commonTags(@Value("${app.environment:local}") String environment) {
        return registry -> registry.config().commonTags("environment", environment);
    }
}
