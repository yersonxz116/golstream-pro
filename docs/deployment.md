# Guía de Despliegue y Puesta en Producción

## Despliegue con Docker Compose

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/strongiptv.git
   cd strongiptv
   ```

2. **Configurar las variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con contraseñas de producción y claves de cifrado seguras
   ```

3. **Generar claves seguras**:
   ```bash
   # Generar clave de cifrado AES de 32 bytes (64 caracteres hexadecimales)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Construir y levantar contenedores**:
   ```bash
   docker compose up -d --build
   ```

5. **Ejecutar migraciones y seeders en el contenedor**:
   ```bash
   docker compose exec backend npx prisma migrate deploy
   docker compose exec backend npm run seed
   ```

6. **Verificar el estado de los servicios**:
   - Web: `http://localhost:3000`
   - Backend API: `http://localhost:4000/api/health`
