# Especificación de Endpoints de la API

Base URL: `/api`

## Autenticación
- `POST /api/auth/login`: Autentica al usuario (admin o user) y emite token JWT.
- `GET /api/auth/me`: Retorna los datos del usuario actual y estado de suscripción.
- `POST /api/auth/logout`: Invalida la sesión actual.

## Panel de Administración (Requiere Rol Admin)
- `GET /api/admin/users`: Listado de usuarios con estado de suscripción y cuentas IPTV.
- `POST /api/admin/users`: Creación de un nuevo usuario.
- `PUT /api/admin/users/:id`: Edición de datos de usuario.
- `DELETE /api/admin/users/:id`: Eliminación lógica/física de usuario.
- `PUT /api/admin/users/:id/iptv`: Asigna y cifra credenciales Strong IPTV.
- `POST /api/admin/users/:id/iptv/test`: Prueba la conexión directa contra el servidor Xtream Codes.
- `POST /api/admin/subscriptions/:userId/activate`: Activa suscripción por 1 mes.
- `POST /api/admin/subscriptions/:userId/renew`: Renueva (+1 mes) la suscripción y registra historial.
- `POST /api/admin/subscriptions/:userId/suspend`: Suspende la suscripción del usuario.
- `GET /api/admin/channels`: Obtiene canales de fútbol configurables.
- `PUT /api/admin/channels/:id`: Modifica visibilidad, orden o nombre del canal.
- `POST /api/admin/channels/sync`: Sincroniza canales desde Xtream filtrando fútbol.

## Área de Usuario (Requiere Autenticación y Suscripción Activa)
- `GET /api/channels`: Lista de canales de fútbol habilitados para el usuario.
- `GET /api/channels/favorites`: Lista de canales favoritos del usuario.
- `POST /api/channels/:id/favorite`: Añade o elimina canal de favoritos (toggle).
- `GET /api/stream/:token/:channelId/index.m3u8`: Proxy del manifiesto maestro HLS.
- `GET /api/stream/:token/:channelId/segments/:segmentName`: Proxy de segmentos de video TS/AAC.
