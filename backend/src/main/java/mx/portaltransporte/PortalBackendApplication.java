package mx.portaltransporte;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PortalBackendApplication {
    public static void main(String[] args) { SpringApplication.run(PortalBackendApplication.class, args); }
}
