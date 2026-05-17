# Conexion futura con Firebase

La app esta lista para conectar Firebase, pero por ahora corre en modo demo para que podamos probar la interfaz y la logica basica sin depender de internet.

## Servicios que usaremos

```text
Firebase Authentication  Login de usuarios
Cloud Firestore          Clientes, creditos, pagos, gastos y caja
Firebase Storage         Fotos o comprobantes, mas adelante
```

## Colecciones sugeridas en Firestore

```text
usuarios
clientes
creditos
pagos
gastos
cajas
rutas
```

## Flujo de datos esperado

```text
Cobrador registra pago en Android
↓
La app guarda el pago en Firestore
↓
Firestore actualiza el saldo del credito
↓
Administrador ve el cambio en su celular
```

## Archivo preparado

Mira este archivo:

```text
src/services/firebase.example.ts
```

Cuando tengamos las claves del proyecto Firebase, lo copiamos como:

```text
src/services/firebase.ts
```

Y agregamos las variables al archivo `.env`.
