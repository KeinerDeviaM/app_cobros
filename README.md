# CobroApp - APK Android privada

Base inicial para una app Android de cobranza hecha con Expo + React Native + TypeScript.

## Que contiene

- Diseno visual basado en el boceto que hicimos.
- Pantallas principales de cobranza.
- Estado demo funcional.
- Calculo de saldos y pagos.
- Caja diaria y reportes basicos.
- Preparacion para Firebase.
- Configuracion inicial para generar APK con EAS.

## Abrir en IntelliJ IDEA

1. Descomprime el ZIP.
2. Abre IntelliJ IDEA.
3. Ve a `File > Open`.
4. Selecciona la carpeta `CobroApp-Android-APK`.
5. Abre la terminal integrada de IntelliJ.
6. Ejecuta:

```bash
npm install
npm start
```

## Probar en celular Android

1. Instala Expo Go en tu Android.
2. Ejecuta `npm start`.
3. Escanea el QR que aparece en la terminal.

## Probar con emulador Android

Necesitas Android Studio instalado con un emulador creado. Luego ejecuta:

```bash
npm run android
```

## Login demo

```text
Correo: admin@cobroapp.com
Contrasena: 123456
```

En esta version, el login es de prueba. No valida Firebase todavia.

## Comandos utiles

```bash
npm start        Inicia Expo
npm run android  Abre en Android/emulador
npm run apk      Genera APK privada con EAS
npm run typecheck Revisa errores de TypeScript
```

## Proximo paso

El siguiente cambio recomendado es conectar Firebase para que los clientes, creditos y pagos se guarden en la nube y se sincronicen entre todos los celulares.
