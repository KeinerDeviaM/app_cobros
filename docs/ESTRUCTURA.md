# Estructura de CobroApp

Este proyecto es una base real para Android usando Expo + React Native.

## Carpetas principales

```text
src/components   Componentes reutilizables: botones, tarjetas, inputs, barras.
src/screens      Pantallas de la app.
src/state        Estado global temporal en modo demo.
src/data         Datos iniciales de prueba.
src/theme        Colores y estilo base.
src/types        Tipos TypeScript.
src/utils        Utilidades de dinero y fechas.
src/services     Preparacion para Firebase.
```

## Pantallas incluidas

```text
Login
Dashboard
Clientes
Nuevo cliente
Creditos
Nuevo credito
Pagos
Registrar pago
Caja diaria
Reportes
Mas opciones
```

## Que ya funciona en modo demo

- Entrar a la app con datos de prueba.
- Ver dashboard.
- Crear clientes.
- Crear creditos.
- Registrar pagos.
- Actualizar saldo pendiente.
- Ver pagos.
- Ver caja diaria.
- Registrar gastos.
- Ver reportes basicos.

## Que falta conectar

- Firebase Authentication para login real.
- Firestore para guardar datos en la nube.
- Reglas de seguridad por rol.
- Sincronizacion entre celulares.
- Generacion de APK firmada para compartir.
