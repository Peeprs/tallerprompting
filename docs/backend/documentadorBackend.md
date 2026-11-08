---
name: documentador-spring-boot
description: se encargara de documentar de manera profesional, incluido las mejores practicas de documentacion todo lo relacionado a el backend especialmente spring-boot,
version: 1.0.0
language: es
requires: ../backend/src/*
---
# Spring Boot Practices 🚀

Repositorio de prácticas y proyectos de aprendizaje con Spring Boot, cubriendo desde conceptos básicos hasta implementaciones avanzadas.

## 📋 Descripción

Este repositorio contiene una colección de proyectos prácticos desarrollados con Spring Boot para explorar diferentes características, patrones y tecnologías del ecosistema Spring. Cada proyecto está diseñado como una práctica independiente que se enfoca en aspectos específicos del framework.

## 🎯 Objetivos

- Dominar los conceptos fundamentales de Spring Boot
- Explorar diferentes módulos del ecosistema Spring
- Implementar patrones de diseño y mejores prácticas
- Practicar integración con bases de datos y servicios externos
- Desarrollar APIs REST robustas y escalables
- Implementar seguridad, testing y documentación

## 📁 Estructura del Repositorio

```
Spring-Boot-Practices/
├── crud/                           # CRUD básico con JPA y H2
├── rest-api/                       # API REST avanzada
├── security-jwt/                   # Autenticación y autorización con JWT
├── microservices/                  # Arquitectura de microservicios
├── data-jpa/                       # Spring Data JPA avanzado
├── web-mvc/                        # Spring MVC y Thymeleaf
├── actuator-monitoring/            # Monitoreo con Spring Boot Actuator
├── testing/                        # Testing completo (Unit, Integration, E2E)
├── docker-deployment/              # Containerización con Docker
└── cloud-config/                   # Spring Cloud Configuration
```

## 🛠️ Proyectos Incluidos

### 1. **CRUD Básico** (`/crud`)
- **Tecnologías**: Spring Boot, Spring Data JPA, H2 Database
- **Características**:
  - Operaciones CRUD completas
  - API REST con endpoints básicos
  - Base de datos en memoria H2
  - Tests unitarios e integración
- **Conceptos**: Entidades JPA, Repositorios, Controladores REST

### 2. **API REST Avanzada** (`/rest-api`)
- **Tecnologías**: Spring Boot, PostgreSQL, Validation, Swagger
- **Características**:
  - Validación de datos
  - Manejo de excepciones personalizado
  - Documentación con OpenAPI/Swagger
  - Paginación y filtrado
- **Conceptos**: DTOs, Mappers, Exception Handlers, API Documentation

### 3. **Seguridad con JWT** (`/security-jwt`)
- **Tecnologías**: Spring Security, JWT, BCrypt
- **Características**:
  - Autenticación basada en tokens JWT
  - Autorización por roles
  - Endpoints protegidos
  - Refresh tokens
- **Conceptos**: Security Configuration, JWT Filters, Role-based Access

### 4. **Microservicios** (`/microservices`)
- **Tecnologías**: Spring Cloud, Eureka, Gateway, Config Server
- **Características**:
  - Service Discovery con Eureka
  - API Gateway
  - Configuration Server
  - Circuit Breaker
- **Conceptos**: Distributed Systems, Service Mesh, Load Balancing

### 5. **Spring Data JPA Avanzado** (`/data-jpa`)
- **Tecnologías**: Spring Data JPA, MySQL, Redis
- **Características**:
  - Consultas personalizadas
  - Especificaciones y Criteria API
  - Caching con Redis
  - Auditoría de entidades
- **Conceptos**: Custom Queries, Specifications, Caching, Auditing

### 6. **Spring MVC Web** (`/web-mvc`)
- **Tecnologías**: Spring MVC, Thymeleaf, Bootstrap
- **Características**:
  - Aplicación web con vistas
  - Formularios y validación
  - Internacionalización
  - Upload de archivos
- **Conceptos**: MVC Pattern, Template Engines, Form Handling

### 7. **Monitoreo con Actuator** (`/actuator-monitoring`)
- **Tecnologías**: Spring Boot Actuator, Micrometer, Prometheus
- **Características**:
  - Health checks personalizados
  - Métricas de aplicación
  - Endpoints de monitoreo
  - Integración con Prometheus
- **Conceptos**: Application Monitoring, Health Indicators, Metrics

### 8. **Testing Completo** (`/testing`)
- **Tecnologías**: JUnit 5, Mockito, TestContainers, WireMock
- **Características**:
  - Tests unitarios
  - Tests de integración
  - Tests E2E con TestContainers
  - Mocking de servicios externos
- **Conceptos**: Test Pyramid, Test Doubles, Integration Testing

### 9. **Deployment con Docker** (`/docker-deployment`)
- **Tecnologías**: Docker, Docker Compose, Multi-stage builds
- **Características**:
  - Containerización de aplicaciones
  - Docker Compose para servicios
  - Optimización de imágenes
  - Health checks en containers
- **Conceptos**: Containerization, Orchestration, DevOps

### 10. **Spring Cloud Config** (`/cloud-config`)
- **Tecnologías**: Spring Cloud Config, Git, Vault
- **Características**:
  - Configuración centralizada
  - Profiles por ambiente
  - Refresh dinámico
  - Encriptación de propiedades
- **Conceptos**: Configuration Management, Environment Profiles

## 🚀 Cómo Empezar

### Prerrequisitos
- Java 17 o superior
- Maven 3.6+
- Docker (para algunos proyectos)
- IDE (IntelliJ IDEA, Eclipse, VS Code)

### Clonar el Repositorio
```bash
git clone https://github.com/albertovgs/Spring-Boot-Practices.git
cd Spring-Boot-Practices
```

### Ejecutar un Proyecto Específico
```bash
# Navegar al proyecto deseado
cd crud

# Ejecutar la aplicación
./mvnw spring-boot:run

# O compilar y ejecutar
./mvnw clean package
java -jar target/crud-0.0.1-SNAPSHOT.jar
```

### Ejecutar Tests
```bash
# Tests de un proyecto específico
cd crud
./mvnw test

# Tests con cobertura
./mvnw test jacoco:report
```

## 📚 Recursos de Aprendizaje

### Documentación Oficial
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [Spring Framework Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/)
- [Spring Data JPA](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Spring Security](https://docs.spring.io/spring-security/reference/)

### Guías Recomendadas
- [Spring Boot Guides](https://spring.io/guides)
- [Baeldung Spring Tutorials](https://www.baeldung.com/spring-tutorial)
- [Spring Academy](https://spring.academy/)

## 🛡️ Mejores Prácticas Implementadas

### Arquitectura
- ✅ Separación de responsabilidades (Controller, Service, Repository)
- ✅ Inyección de dependencias
- ✅ Configuración externalizada
- ✅ Manejo centralizado de excepciones

### Seguridad
- ✅ Validación de entrada
- ✅ Autenticación y autorización
- ✅ Protección CSRF
- ✅ Headers de seguridad

### Testing
- ✅ Tests unitarios con alta cobertura
- ✅ Tests de integración
- ✅ Tests de contratos API
- ✅ Mocking apropiado

### DevOps
- ✅ Containerización con Docker
- ✅ Health checks y métricas
- ✅ Logging estructurado
- ✅ Profiles por ambiente

## 🔧 Herramientas y Tecnologías

### Core Framework
- Spring Boot 3.x
- Spring Framework 6.x
- Java 17+

### Bases de Datos
- H2 (desarrollo)
- PostgreSQL
- MySQL
- Redis (caching)

### Testing
- JUnit 5
- Mockito
- TestContainers
- WireMock

### DevOps
- Docker & Docker Compose
- Maven
- GitHub Actions (CI/CD)

### Monitoreo
- Spring Boot Actuator
- Micrometer
- Prometheus
- Grafana

## 📈 Roadmap de Aprendizaje

### Nivel Principiante
1. **CRUD Básico** - Fundamentos de Spring Boot
2. **API REST** - Desarrollo de APIs
3. **Testing** - Pruebas básicas

### Nivel Intermedio
4. **Seguridad JWT** - Autenticación y autorización
5. **Data JPA Avanzado** - Persistencia compleja
6. **Web MVC** - Aplicaciones web

### Nivel Avanzado
7. **Microservicios** - Arquitectura distribuida
8. **Monitoreo** - Observabilidad
9. **Docker** - Containerización
10. **Cloud Config** - Configuración distribuida

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Si tienes ideas para nuevas prácticas o mejoras:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-practica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva práctica de...'`)
4. Push a la rama (`git push origin feature/nueva-practica`)
5. Abre un Pull Request

### Tipos de Contribuciones
- 🐛 Corrección de bugs
- ✨ Nuevas prácticas o proyectos
- 📚 Mejoras en documentación
- 🧪 Mejores tests
- 🔧 Optimizaciones de código

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Alberto VGS**
- GitHub: [@albertovgs](https://github.com/albertovgs)
- LinkedIn: [Alberto VGS](https://linkedin.com/in/albertovgs)

## ⭐ Agradecimientos

- Comunidad Spring Boot
- Documentación oficial de Spring
- Contribuidores de código abierto
- Tutoriales y guías de la comunidad

---

**¿Te gusta este repositorio?** ¡Dale una ⭐ y compártelo con otros desarrolladores!

**¿Tienes preguntas?** Abre un [issue](https://github.com/albertovgs/Spring-Boot-Practices/issues) y te ayudaremos.

---

*Última actualización: Octubre 2025*

## Contrato de observabilidad para el documentador de Backend

Este documento es una guía de prácticas; el contrato operativo del proyecto vive en `TRACING.md`. Al documentar un cambio de backend:

1. Registrar la tarea con `node scripts/agent-trace.mjs start --agent backend-doc --task <TASK> --workflow <WF>` y conservar el `trace_id`.
2. Identificar y reportar, con rutas reales: controladores, endpoints, servicios, repositorios, DTOs, entidades, migraciones, configuración y pruebas afectadas.
3. Emitir `docs.impact.detected` con `--attr components=... --attr endpoints=... --attr services=... --attr dtos=... --attr configs=... --attr docs_to_update=...`.
4. Incluir el `trace_id` de la tarea y, si se ejecutó una prueba HTTP, el `X-Trace-Id` devuelto por Spring Boot.
5. Cerrar con `agent.task.completed` y evidencia verificable (`mvn -B compile`, prueba HTTP, archivo o diff). Sin evidencia, el estado es `partial` o `failed`.
6. No documentar endpoints, DTOs o configuraciones que no se hayan inspeccionado; no incluir secretos ni datos personales en la documentación ni en los eventos.
