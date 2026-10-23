# Arquitectura del Sistema: GolStream Pro

## Visión General
GolStream Pro es una solución integral para la gestión y reproducción segura de streams de fútbol vía Strong IPTV (protocolo Xtream Codes), accesible mediante cliente Web y aplicación móvil APK (Android / Android TV).

```
+-------------------------------------------------------------------------+
|                              CLIENTES                                   |
|   +--------------------------------+   +----------------------------+   |
|   |         Web Frontend           |   |       Capacitor APK        |   |
|   |  (React + Tailwind + Hls.js)   |   |   (Android / Android TV)   |   |
|   +--------------------------------+   +----------------------------+   |
+------------------------------------+------------------------------------+
                                     | HTTPS / WSS
+------------------------------------v------------------------------------+
|                         BACKEND API & PROXY                             |
|  - Middleware de Autenticación (JWT HttpOnly / Bearer)                  |
|  - Middleware de Roles (Admin vs User)                                  |
|  - Middleware de Suscripción (Válida / Expirada / Suspendida)           |
|  - Streaming Proxy HLS (CORS & Mixed-Content Resolver)                  |
|  - Cifrado de Credenciales IPTV (AES-256-GCM)                           |
|  - Scheduler de Expiración Automática (node-cron)                       |
+-------------------+--------------------------------+--------------------+
                    |                                |
+-------------------v------------+     +-------------v--------------------+
|     BASE DE DATOS (Prisma)     |     |   PROVEEDOR STRONG IPTV (Xtream) |
|   Users, Roles, Subscriptions  |     |   player_api.php & Streams HLS   |
|   IPTV Accounts (Cifradas)     |     +----------------------------------+
+--------------------------------+
```

## Principios de Seguridad
1. **Zero-Leakage**: Las credenciales de Strong IPTV (usuario, contraseña y host) nunca viajan al navegador o app.
2. **Proxy de Manifiestos y Segmentos**: El backend actúa como proxy seguro, descargando los segmentos de video y retransmitiéndolos con cabeceras CORS permisivas y sobre HTTPS, resolviendo bloqueos de contenido mixto.
3. **Control de Conexiones Simultáneas**: Los tokens de streaming son temporales y se invalidan si la suscripción expira o si se detecta uso abusivo.
