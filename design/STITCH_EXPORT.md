# Exportación de Pantallas y Diseños de Stitch MCP

Proyecto Stitch: `projects/2001051518567146454` (**GolStream Pro - Live Sports IPTV**)

## 1. Pantalla: Live Football Streaming Terminal & Cinema Player
- **Session ID**: `11747820176085300956`
- **Dispositivo**: Desktop / TV 10-Foot Lean-back ready (2560px viewport).
- **Componentes Diseñados**:
  - *Top Navigation Bar*: Branding `GOLSTREAM PRO`, indicador de señal de satélite activa, contador de partidos en vivo, buscador instantáneo (`⌘K`), selector de vistas y control de cuenta.
  - *Leagues & Tactical Sidebar*: Navegación deportiva con telemetría de latencia de nodo (`Node 01: 12ms / 60 FPS`) y filtros instantáneos de ligas (UEFA Champions League, Premier League, LaLiga EA Sports, CONMEBOL Libertadores).
  - *Cinema Player & Broadcast Stage*: Reproductor inmersivo con overlay de telemetría de buffer y bitrate en tiempo real (`Buffer: 0.18s | Bitrate: 18.4 Mbps | Codec: HEVC/H.264 60fps`). Controles de Play/Pause, volumen, selector de pistas de audio multi-idioma (Dolby Atmos / Español), y selector de resolución adaptativa (`4K`, `1080p`, `720p`, `Auto`).
  - *Live Sports Channels Grid*: Tarjetas con estado `EN VIVO` en verde esmeralda brillante (`#4edea3`), métricas de audiencia, tasa de bits y botón de reproducción directa.
  - *Technical Telemetry Footer*: Barra inferior con métricas de salud del streaming proxy y estado de conexión P2P.

## 2. Pantalla: Subscriber Lifecycle & IPTV Operations Dashboard
- **Session ID**: `7779713822188783600`
- **Dispositivo**: Desktop / Admin Console (2560px).
- **Componentes Diseñados**:
  - *Tabla de Gestión de Suscriptores*: Filtros por *Todos*, *Activos*, *Por Vencer (<= 5 días)* y *Vencidos*. Badges con pulsación lumínica. Controles de acción rápida: botón `+1 Mes` para extensión automática, botón de Suspensión temporal y edición de permisos.
  - *Modal Táctico de Asignación de Credenciales Strong IPTV*: Formulario de alta para usuario, contraseña generada de alta entropía y host DNS Xtream Codes. Incluye módulo de **Prueba de Conexión en Vivo** con telemetría de verificación de handshake contra `player_api.php`.
  - *Matriz de Distribución y Ruteo de Canales*: Grid de canales con switch de visibilidad (`Activo ON / Oculto OFF`), selector de orden de prioridad, edición rápida de títulos y comprobador de señal activa.
