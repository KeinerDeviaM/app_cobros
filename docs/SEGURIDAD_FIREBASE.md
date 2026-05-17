SEGURIDAD FIREBASE - COBROAPP

Objetivo

Estas reglas protegen usuarios, clientes, créditos, pagos, gastos, rutas, visitas, cierres de caja, configuración del negocio y auditoría.

Principios aplicados

1. Solo usuarios autenticados y activos pueden leer datos principales.
2. El administrador puede gestionar información sensible.
3. El cobrador puede trabajar con datos operativos.
4. Los registros sensibles no se eliminan físicamente.
5. La auditoría no se puede editar ni borrar.
6. Los pagos, créditos y gastos se manejan por estado.
7. El usuario administrador no puede desactivarse a sí mismo.

Colecciones esperadas

usuarios
clientes
creditos
pagos
gastos
rutas
visitas
cierresCaja
cashClosings
configuracion
businessSettings
auditoria

Comando para desplegar

firebase deploy --only firestore:rules,firestore:indexes --project cobroapp-keiner-35b05

Si una pantalla deja de cargar después de desplegar reglas, revisar el error exacto de Firebase y ajustar permisos o consultas.