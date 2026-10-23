# Changelog

Todas las modificaciones notables de este proyecto se documentarán en este archivo según el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y siguiendo [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

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
