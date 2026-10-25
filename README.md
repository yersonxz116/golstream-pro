# GolStream Pro - Plataforma IPTV de Fútbol

[![Continuous Integration](https://github.com/strongiptv/golstream-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/strongiptv/golstream-pro/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Node: 24+](https://img.shields.io/badge/Node-24%2B-green.svg)](https://nodejs.org/)

GolStream Pro es una plataforma integral de alto rendimiento diseñada específicamente para la gestión de usuarios, control de suscripciones y reproducción optimizada de canales de fútbol vía Strong IPTV (protocolos Xtream Codes / HLS). Disponible para acceso **Web Responsive** y como **Aplicación Móvil / Android TV (APK)**.

---

## Características Principales

### 🛡️ Panel de Administración
- **Gestión de Usuarios**: CRUD completo de usuarios con asignación individual de cuentas IPTV (usuario, contraseña y DNS de Strong IPTV).
- **Cifrado Militar**: Credenciales IPTV almacenadas bajo cifrado **AES-256-GCM**. Nunca son expuestas en el API, frontend ni logs.
- **Control de Suscripciones**: Ciclos de suscripción mensual (activación, renovación +1 mes, suspensión y cancelación) con bitácora de historial.
- **Scheduler Automático**: Tareas programadas que detectan suscripciones vencidas en tiempo real y bloquean el reproductor.
- **Validador de Cuentas IPTV**: Botón de prueba instantánea que valida la conexión contra la API Xtream (`player_api.php`).
- **Gestor de Canales Deportivos**: Sincronización, renombrado, ordenamiento y activación/desactivación de canales de fútbol.

### ⚽ Área de Usuario & Experiencia de Streaming
- **Sidebar Vertical Translúcido (Diseño Stitch)**: Navegación basada en glassmorphism (`backdrop-blur-2xl bg-[#090d16]/80`), 100% vertical y completamente **ocultable/colapsable** con un clic para activar el **Modo Cine Expansivo** a pantalla completa.
- **Guardián Anti-Congelamiento (Anti-Freeze Watchdog)**: Sistema de supervisión en tiempo real cada 2 segundos con auto-recuperación escalonada (salto de baches publicitarios PTS, nudges y sincronización con el punto en vivo) que previene pausas inesperadas.
- **Buffer Suavizado para Chunks de 10s**: Configuración de búfer anticipado de 30 a 60 segundos que amortigua la latencia y la congestión del proveedor IPTV.
- **Insignias Vectoriales de Canales**: Logos vectoriales oficiales SVG de 0 ms para todas las cadenas deportivas (Win Sports, DSPORTS / DIRECTV Sports, ESPN 1-4, Fox Sports, Champions League, DAZN, etc.), evitando cajas negras vacías por URLs upstream rotas.
- **Buscador & Favoritos**: Filtro instantáneo de señales deportivas, agrupadas por ligas y torneos, con marcación rápida de canales favoritos.
- **Reproductor HLS Avanzado**: Selección adaptativa de bitrate (calidad), selector de pistas de audio, control de volumen, pantalla completa y reconexión automática ante microcortes.
- **Avisos de Suscripción**: Notificaciones visuales cuando la suscripción se aproxima a expirar o se encuentra vencida.

### 🌐 Streaming Proxy (Solución a Mixed-Content & CORS)
- Resuelve de raíz el bloqueo de navegadores cuando el stream IPTV proviene de servidores HTTP inseguros, sirviendo manifiestos y fragmentos mediante un túnel proxy HTTPS seguro con Keep-Alive y reintento resiliente.
- Protege las credenciales de la cuenta IPTV evitando que el usuario final inspeccione las URLs maestras del proveedor.
- Tokens de streaming firmados por HMAC con 24 horas de vigencia ininterrumpida.

---

## Estructura del Monorepo

```
/
├── backend/          # API REST, proxy HLS, Prisma ORM, middlewares y tests
├── web/              # Frontend React + Tailwind CSS + Hls.js
├── mobile/           # Proyecto Capacitor para Android / Android TV
├── design/           # Tokens, esquemas y capturas del diseño Stitch
├── docs/             # Arquitectura, base de datos, endpoints y despliegue
├── scripts/          # Auditoría de streams de video/audio con ffprobe
├── docker/           # Dockerfiles y configuración Nginx
├── .github/          # Workflows de CI, plantillas de Issues y PR
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
├── CHANGELOG.md
└── README.md
```

---

## Requisitos Previos

- **Node.js**: Versión 20 o 24 LTS
- **npm**: Versión 10+
- **Git**
- **FFmpeg / ffprobe**: Requerido para el script de auditoría de canales.
- *(Opcional)* **Docker & Docker Compose**: Para despliegue contenerizado con MySQL.

---

## Instalación y Puesta en Marcha Local

### 1. Clonar el repositorio y configurar variables
```bash
git clone https://github.com/strongiptv/golstream-pro.git
cd golstream-pro
cp .env.example backend/.env
```

### 2. Configurar e Iniciar Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```
El servidor backend se iniciará en `http://localhost:4000`.

### 3. Configurar e Iniciar Frontend Web
En una nueva terminal:
```bash
cd web
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## Pruebas Automatizadas

Ejecutar la suite completa de pruebas unitarias y de integración del backend:
```bash
cd backend
npm test
```
Verifica:
1. Autenticación y hashing de contraseñas.
2. Middleware de control de acceso por rol (`admin` vs `user`).
3. Cifrado y descifrado AES-256-GCM de credenciales IPTV.
4. Lógica de activación, renovación y expiración de suscripciones.
5. Bloqueo de acceso al reproductor ante suscripciones vencidas.

---

## Auditoría Automatizada de Canales

El proyecto incluye una herramienta de auditoría automatizada que valida cada stream de fútbol mediante `ffprobe`:
```bash
npm run audit:channels
```
El script comprueba:
- Respuesta HTTP y validez del manifiesto HLS (.m3u8).
- Descarga efectiva de segmentos de video.
- Detección de pistas de audio activas y verificación de no-silencio.
- Latencia de arranque y genera una tabla resumen con los resultados.

---

## Credenciales de Prueba

Al ejecutar el seeder (`npm run seed`), la base de datos se inicializa con los siguientes usuarios de prueba:

| Rol | Correo Electrónico | Contraseña | Descripción |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@golstream.pro` | `AdminSecurePassword2026!` | Acceso completo al Panel de Administración (`/admin`), control de usuarios, suscripciones y configuración IPTV. |
| **Suscriptor** | `usuario@golstream.pro` | `UserSecure123!` | Cuenta de usuario con 30 días de suscripción activa y acceso a todos los canales en vivo. |

---

## Compilación de la APK (Android)

Para generar el instalable Android:
```bash
cd web
npm run build
cd ../mobile
npx cap sync
npx cap open android
```
O compilar directamente con Gradle:
```bash
cd mobile/android
./gradlew assembleDebug
```
El APK resultante se generará en `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

---

## ⚖️ Descargo de Responsabilidad Legal (Disclaimer)

GolStream Pro es un reproductor multimedia y suite de software desarrollada con fines educativos, de investigación técnica y gestión personal de medios.

- **Sin contenido propio:** GolStream Pro no aloja, no distribuye, no retransmite ni suministra ninguna señal audiovisual, canal de televisión o lista de reproducción multimedia.
- **Responsabilidad del usuario:** La configuración de servidores upstream, credenciales Xtream Codes y la legalidad del contenido al que se acceda mediante esta herramienta es responsabilidad exclusiva del usuario final.
- **Marcas comerciales:** Todas las marcas, logotipos, nombres de canales y empresas mencionadas pertenecen a sus respectivos titulares y se utilizan únicamente con fines ilustrativos e identificativos bajo la doctrina de uso legítimo (*fair use*).

---

## Contribución y Licencia

Para pautas de desarrollo y convenciones de commits, consulta [CONTRIBUTING.md](CONTRIBUTING.md).
Distribuido bajo la [Licencia MIT](LICENSE).
