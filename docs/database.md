# Esquema y Diccionario de Datos

La persistencia está modelada con Prisma ORM, compatible tanto con SQLite (entorno local de desarrollo y tests continuos) como con MySQL (producción).

## Tablas Principales

### 1. `roles`
- `id` (VARCHAR PK): Identificador único (`admin`, `user`).
- `name` (VARCHAR): Nombre legible del rol.

### 2. `users`
- `id` (VARCHAR PK): UUID del usuario.
- `email` (VARCHAR UK): Correo electrónico para autenticación.
- `name` (VARCHAR): Nombre completo del usuario.
- `passwordHash` (VARCHAR): Hash bcrypt de la contraseña.
- `status` (VARCHAR): `ACTIVE`, `INACTIVE`, `SUSPENDED`.
- `roleId` (VARCHAR FK): Referencia a `roles.id`.
- `createdAt`, `updatedAt` (DATETIME).

### 3. `iptv_accounts`
- `id` (VARCHAR PK): UUID.
- `userId` (VARCHAR FK UK): Unívoco por usuario.
- `encryptedUsername` (TEXT): Nombre de usuario IPTV cifrado en AES-256-GCM.
- `encryptedPassword` (TEXT): Contraseña IPTV cifrada en AES-256-GCM.
- `encryptedHost` (TEXT): DNS/Host del proveedor Xtream cifrado.
- `lastTestedAt` (DATETIME): Última verificación exitosa contra `player_api.php`.
- `isValid` (BOOLEAN): Estado de funcionamiento reportado por la prueba.

### 4. `subscriptions`
- `id` (VARCHAR PK): UUID.
- `userId` (VARCHAR FK UK): Relación 1:1 activa con el usuario.
- `startDate` (DATETIME): Fecha de inicio del periodo.
- `endDate` (DATETIME): Fecha de vencimiento (calculada a 1 mes por ciclo).
- `status` (VARCHAR): `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `SUSPENDED`.

### 5. `subscription_history`
- `id` (VARCHAR PK): UUID.
- `subscriptionId` (VARCHAR FK): Historial de transacciones de la suscripción.
- `action` (VARCHAR): `ACTIVATED`, `RENEWED`, `SUSPENDED`, `CANCELLED`.
- `effectiveDate` (DATETIME): Fecha de ejecución.
- `newEndDate` (DATETIME): Nueva fecha de expiración tras renovación.
- `notes` (TEXT): Observaciones del administrador.

### 6. `categories` & `channels`
- `categories`: `id`, `externalId`, `name`, `isVisible`, `sortOrder`.
- `channels`: `id`, `externalStreamId`, `name`, `logoUrl`, `categoryId`, `isVisible`, `sortOrder`, `isWorking`, `lastCheckedAt`.

### 7. `favorites`
- `id` (VARCHAR PK): UUID.
- `userId` (VARCHAR FK) + `channelId` (VARCHAR FK).
