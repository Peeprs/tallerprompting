package mx.portaltransporte.observability;

import io.micrometer.tracing.Tracer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Correlación de solicitudes HTTP con la traza distribuida.
 * Actor: sistema. Técnica: request_id acotado, MDC limpio por hilo y cabeceras de respuesta sin datos sensibles.
 *
 * <p>Se ejecuta dentro del filtro de observación de Spring Boot (orden HIGHEST_PRECEDENCE + 1),
 * por lo que el span del servidor ya existe cuando se leen traceId/spanId.</p>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestCorrelationFilter extends OncePerRequestFilter {

    private static final Logger httpLog = LoggerFactory.getLogger("httpAudit");
    private static final Pattern SAFE_ID = Pattern.compile("^[A-Za-z0-9._:-]{8,64}$");
    private static final String REQUEST_ID = "requestId";
    private static final String SESSION_ID = "sessionId";
    private static final String AGENT_ID = "agentId";

    private final Tracer tracer;

    public RequestCorrelationFilter(Tracer tracer) {
        this.tracer = tracer;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = sanitize(request.getHeader("X-Request-Id"));
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
        }
        String sessionId = sanitize(request.getHeader("X-Session-Id"));
        String agentId = sanitize(request.getHeader("X-Agent-Id"));

        MDC.put(REQUEST_ID, requestId);
        if (sessionId != null) {
            MDC.put(SESSION_ID, sessionId);
        }
        if (agentId != null) {
            MDC.put(AGENT_ID, agentId);
        }

        response.setHeader("X-Request-Id", requestId);
        String traceId = currentTraceId();
        if (traceId != null) {
            response.setHeader("X-Trace-Id", traceId);
        }

        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } catch (Exception failure) {
            // No se registra el mensaje: puede contener datos de entrada.
            httpLog.warn("event=http.request.failed method={} path={} error={} request_id={} trace_id={} span_id={}",
                    request.getMethod(), request.getRequestURI(), failure.getClass().getSimpleName(),
                    requestId, currentTraceId(), currentSpanId());
            throw failure;
        } finally {
            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            String finalTraceId = currentTraceId();
            if (finalTraceId != null && !response.isCommitted() && response.getHeader("X-Trace-Id") == null) {
                response.setHeader("X-Trace-Id", finalTraceId);
            }
            httpLog.info("event=http.request.completed method={} path={} status={} duration_ms={} request_id={} trace_id={} span_id={}",
                    request.getMethod(), request.getRequestURI(), response.getStatus(), elapsedMs,
                    requestId, finalTraceId, currentSpanId());
            MDC.remove(REQUEST_ID);
            MDC.remove(SESSION_ID);
            MDC.remove(AGENT_ID);
        }
    }

    // Lee el traceId del span actual o del MDC. Actor: sistema. Técnica: tolerante a ausencia de traza.
    private String currentTraceId() {
        var span = tracer.currentSpan();
        if (span != null) {
            return span.context().traceId();
        }
        return MDC.get("traceId");
    }

    // Lee el spanId actual. Actor: sistema. Técnica: tolerante a ausencia de traza.
    private String currentSpanId() {
        var span = tracer.currentSpan();
        if (span != null) {
            return span.context().spanId();
        }
        return MDC.get("spanId");
    }

    // Acepta solo identificadores con forma segura. Actor: sistema. Técnica: evita inyección en logs o cabeceras.
    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return SAFE_ID.matcher(trimmed).matches() ? trimmed : null;
    }
}
