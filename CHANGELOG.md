# Changelog

Todas las modificaciones notables de este proyecto se documentarán en este archivo según el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y siguiendo [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.1.0] - 2026-10-25
### Added
- **Motor Anti-Congelamiento (Anti-Freeze Watchdog)**:
  - Guardián activo de reproducción que evalúa el progreso del stream cada 2000 ms.
  - Recuperación escalonada ante congelamientos:
    - *Nivel 1 (2-3s)*: Nudge de +250 ms hacia adelante para superar baches de timestamp (PTS/DTS) producidos durante cortes publicitarios.
    - *Nivel 2 (4-6s)*: Salto al punto en vivo (`liveSyncPosition`) y recarga inmediata de búfer.
    - *Nivel 3 (Fallo profundo)*: Recuperación automática del decodificador multimedia (`recoverMediaError()`) sin desconectar al usuario ni requerir recargar la página.
- **Optimización de Buffer para Segmentos IPTV de 10s**:
  - Ajuste de `maxBufferLength` a 30 segundos (3 segmentos completos de anticipación) y `maxMaxBufferLength: 60`.
  - Desactivación de `lowLatencyMode` agresivo para flujos de 10 segundos, estabilizando la continuidad y eliminando caídas de búfer.
  - Salto automático de baches publicitarios con `maxBufferHole: 3` y `highBufferWatchdogPeriod: 2`.
- **Resiliencia en el Proxy Backend**:
  - Reintento transparente con conexión limpia ante fluctuaciones o caídas temporales del servidor IPTV upstream en `/chunk` y `/index.m3u8`.
  - Ampliación de vigencia del token de transmisión firmado (`STREAM_TOKEN_SECRET`) a 24 horas ininterrumpidas.
- **Rediseño UI Stitch: Sidebar Vertical Translúcido y Ocultable**:
  - Interfaz basada en el sistema de diseño Stitch (*GolStream Pro*): efecto glassmorphism con `backdrop-blur-2xl bg-[#090d16]/80` y bordes sutiles `border-white/[0.08]`.
  - Capacidad de ocultar/colapsar el sidebar vertical en 1 clic para disfrutar del **Modo Cine Expansivo** a pantalla completa (100% de ancho).
  - Píldora flotante e indicadores en navbar para alternar la visibilidad de canales en escritorio y dispositivos móviles.
  - Flujo de navegación estrictamente vertical: buscador en tiempo real, acordeón selector de categorías con conteo de señales y switch de favoritos.
- **Insignias Vectoriales Oficiales para Canales sin Logo**:
  - Sistema de renderizado vectorial SVG de 0 ms para canales con URLs caídas o vacías: Win Sports, Win Sports+, DIRECTV Sports (DSPORTS 1, DSPORTS HD, DSPORTS Argentina), ESPN 1-4, Fox Sports, UEFA Champions League, DAZN, Movistar+, TNT Sports, TyC Sports, Premier League y LaLiga.
- **Canales Prioritarios Integrados**:
  - Sincronización y categorización destacada de señales lineales oficiales de la UEFA Champions League y DIRECTV Sports (DSPORTS).

## [1.0.0] - 2026-10-23
### Added
- **Backend API & Middleware**:
  - Autenticación segura mediante JWT y bcrypt.
  - Middlewares de autorización estricta: `requireAdmin` (403 para usuarios normales en `/api/admin/*`) y `requireActiveSubscription` (bloqueo automático al expirar o suspender la suscripción).
  - Cifrado de credenciales de Strong IPTV con **AES-256-GCM** (nunca se exponen en API ni cliente).
  - Proxy de streaming HLS (`/api/stream/:token/:channelId/index.m3u8` y chunks) que soluciona Mixed-Content y CORS.
  - Scheduler automático en segundo plano con `node-cron` para detección y expiración de suscripciones vencidas.
  - Seeder con administrador inicial tomado de variables de entorno y usuario suscriptor de prueba.
- **Diseño Stitch MCP**:
  - Exportación del Design Theme oficial *GolStream Pro* (Obsidiana `#0f131c`, Esmeralda `#4edea3`, Sora/DM Sans).
  - Generación de pantallas en Stitch: *Live Football Streaming Terminal & Cinema Player* y *Subscriber Lifecycle & IPTV Operations Dashboard*.
- **Frontend Web Responsive**:
  - Reproductor cinematográfico con `hls.js`, selector adaptativo de calidad, selector de pistas de audio, control de volumen y reconexión automática ante cortes de red.
  - Panel de administración interactivo con CRUD de usuarios, asignador y probador de cuentas IPTV, gestor de renovaciones de 1 mes (+1 mes) y control de canales.
  - Banner y modal de aviso de suscripción próxima a vencer o vencida.
- **Proyecto Móvil Capacitor (Android & Android TV)**:
  - Soporte para aceleración por hardware (`android:hardwareAccelerated="true"`).
  - Soporte de tráfico cleartext para servidores IPTV HTTP (`android:usesCleartextTraffic="true"`).
  - Soporte para Android TV con intent filter `LEANBACK_LAUNCHER` y navegación D-pad.
- **Auditoría Automatizada de Canales**:
  - Script en `scripts/audit_channels.ts` con inspección de streams vía `ffprobe` (video H264, audio AAC sin silencio, medición de latencia y reporte en Markdown).

## [0.1.0] - 2026-10-23
### Added
- Estructura base del monorepo (`backend`, `web`, `mobile`, `design`, `docs`, `scripts`, `docker`, `.github`).
- Configuración de control de versiones Git, ramas protegidas y Conventional Commits.
- Plantillas de PR e Issues en `.github/`.
- Configuración de Docker Compose para entorno completo con MySQL.
- Sistema de integración continua (CI) en GitHub Actions.
- Documentación de arquitectura, base de datos y despliegue.
- Verificación e integración con Stitch MCP (Design Theme: *GolStream Pro*).
