# Guía de Compilación de la Aplicación Móvil y Android TV (APK)

El proyecto móvil está implementado con **Capacitor 6**, empaquetando el frontend web reactivo y optimizado con el reproductor HLS (`hls.js`), aceleración por hardware y soporte nativo para **Android (Celulares y Tablets)** y **Android TV (Modo Leanback)**.

## Requisitos de Entorno para Compilación Nativa
- **JDK**: Java Development Kit 17 (preconfigurado).
- **Android SDK**: Build Tools 34.0.0 y Platform SDK 34 (instalable vía Android Studio o Command Line Tools).
- **Gradle**: Wrapper 8.2.1 integrado en el repositorio.

---

## Estructura del Proyecto Android
```
mobile/
├── capacitor.config.json    # Configuración de appId, esquema https y cleartext
├── package.json             # Dependencias de Capacitor
└── android/                 # Proyecto Gradle nativo de Android
    ├── app/
    │   ├── build.gradle     # Configuración de compileSdk 34 y dependencias
    │   └── src/main/
    │       ├── AndroidManifest.xml # Permisos de red, Android TV Leanback y hardware acceleration
    │       ├── assets/public/      # Binarios empaquetados de la web
    │       └── java/pro/golstream/iptv/MainActivity.java
    ├── build.gradle
    └── gradlew / gradlew.bat
```

---

## Pasos para Compilar el APK (Debug y Release)

### 1. Sincronizar los assets web
Antes de compilar, compila la aplicación web y sincronízala con el proyecto nativo:
```bash
# Desde la raíz del monorepo
cd web
npm run build
cd ../mobile
npx cap sync android
```

### 2. Configurar la ruta del SDK de Android
Copia `mobile/android/local.properties.example` a `mobile/android/local.properties` e indica la ruta de tu SDK:
```properties
sdk.dir=C\:\\Users\\TuUsuario\\AppData\\Local\\Android\\Sdk
```

### 3. Compilar APK Debug
```bash
cd mobile/android
./gradlew assembleDebug
```
El archivo APK generado estará disponible en:
```
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Abrir en Android Studio
Si prefieres compilar visualmente, ejecutar emuladores o conectar un dispositivo Android / Android TV físico:
```bash
cd mobile
npx cap open android
```

---

## Características Nativas Habilitadas
- **Aceleración por Hardware (`android:hardwareAccelerated="true"`)**: Fluidez a 60 FPS en transmisiones deportivas de alta tasa de bits.
- **Tráfico Cleartext (`android:usesCleartextTraffic="true"`)**: Compatibilidad garantizada para servidores IPTV que transmiten bajo HTTP plano.
- **Android TV (`LEANBACK_LAUNCHER`)**: La aplicación aparece directamente en el menú principal de Android TV / Google TV y responde al control remoto (D-pad).
- **WakeLock**: Evita que la pantalla del televisor o celular se apague durante la transmisión de los partidos de fútbol.
