# Guía de Contribución

¡Gracias por contribuir a **GolStream Pro**!

## Convenciones de Commits
Este repositorio sigue la especificación [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

- `feat:` Nueva funcionalidad para el usuario.
- `fix:` Corrección de un error.
- `docs:` Cambios únicamente en documentación.
- `test:` Adición o corrección de pruebas unitarias/integración.
- `chore:` Tareas rutinarias, dependencias o configuración de build.
- `refactor:` Modificación de código que no añade funcionalidades ni corrige bugs.

Ejemplo:
```bash
git commit -m "feat(auth): add role-based middleware for admin and subscriber"
```

## Convenciones de Ramas
- `main`: Rama de producción estable.
- `feature/<nombre>`: Desarrollo de nuevas funcionalidades.
- `fix/<nombre>`: Corrección de incidentes o bugs.
- `chore/<nombre>`: Tareas de mantenimiento o configuración.

## Seguridad y Secretos
- **Bajo ninguna circunstancia** se deben comitear archivos `.env`, credenciales reales de Strong IPTV, claves de cifrado o firmas de APK.
- Todos los valores sensibles deben cargarse vía variables de entorno documentadas en `.env.example`.
