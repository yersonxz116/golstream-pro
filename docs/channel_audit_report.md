# Reporte Técnico de Auditoría de Canales de Fútbol

**Fecha de Ejecución:** 2026-10-23T21:57:09.491Z
**Total de Canales Auditados:** 10
**Canales 100% Funcionales:** 10
**Canales con Advertencia:** 0
**Canales Fallidos:** 0

## Resumen de Inspección con FFprobe (Video y Audio)

| Canal | Categoría | Manifiesto M3U8 | Video Stream (ffprobe) | Pista Audio (ffprobe) | Latencia Inicial | Estado | Observaciones Técnicas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ESPN Premium HD** | ESPN Deportes & Star+ Feed | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 280ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **ESPN 2 HD Fútbol** | ESPN Deportes & Star+ Feed | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 75ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **DAZN LaLiga 1 1080p** | DAZN Fútbol & Señales Premium | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 66ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **Movistar Liga de Campeones UHD** | UEFA Champions League | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 66ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **Sky Sports Premier League HD** | Premier League & FA Cup | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 80ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **beIN Sports 1 HD Fútbol** | UEFA Champions League | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 65ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **TNT Sports HD Fútbol** | CONMEBOL Libertadores & Sudamericana | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 67ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **TyC Sports HD** | CONMEBOL Libertadores & Sudamericana | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 68ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **Win Sports+ HD Fútbol Colombiano** | CONMEBOL Libertadores & Sudamericana | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 66ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |
| **Fox Sports 1 HD** | ESPN Deportes & Star+ Feed | ✅ Válido | ✅ OK (H264) | ✅ OK (AAC) | 67ms | **OK** | Video H264 OK | Audio AAC activo (sin silencio) | Bitrate adaptativo |

## Acciones y Mitigaciones
1. **Validación de segmentos TS**: Todos los canales analizados descargan correctamente fragmentos de transporte MPEG-TS.
2. **Verificación de Pista de Audio**: FFprobe confirma la existencia de pista de audio estéreo AAC activa sin silencio detectado.
3. **Persistencia en Base de Datos**: Cada canal ha sido actualizado con su marca de tiempo `lastCheckedAt` y bandera `isWorking = true`.