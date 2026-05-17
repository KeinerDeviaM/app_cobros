# Como generar la APK

## 1. Instalar dependencias

```bash
npm install
```

## 2. Probar en desarrollo

```bash
npm start
```

Luego puedes abrir con Expo Go escaneando el QR desde tu celular Android.

## 3. Probar con emulador Android

```bash
npm run android
```

## 4. Generar APK privada

Primero instala EAS CLI si no lo tienes:

```bash
npm install -g eas-cli
```

Inicia sesion:

```bash
eas login
```

Configura el proyecto:

```bash
eas build:configure
```

Genera APK privada:

```bash
npm run apk
```

Ese comando usa el perfil `preview` de `eas.json`, configurado para generar APK.

## Nota importante

La APK instala la aplicacion, pero la sincronizacion real entre celulares depende de Firebase/Firestore. En esta primera base los datos son temporales y se reinician al cerrar o recargar la app.
