import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

type AdvancedTab = 'version2' | 'backend' | 'mobile' | 'datos' | 'entrega';

type ModuleItem = {
  title: string;
  status: 'pendiente' | 'delicado' | 'futuro' | 'listo';
  description: string;
  reason: string;
  nextStep: string;
};

function getStatusType(status: ModuleItem['status']) {
  if (status === 'listo') return 'success';
  if (status === 'delicado') return 'danger';
  if (status === 'futuro') return 'warning';
  return 'warning';
}

function getStatusLabel(status: ModuleItem['status']) {
  if (status === 'listo') return 'Listo';
  if (status === 'delicado') return 'Delicado';
  if (status === 'futuro') return 'Futuro';
  return 'Pendiente';
}

const version2Modules: ModuleItem[] = [
  {
    title: 'Crear usuarios con contraseña desde la app',
    status: 'delicado',
    description: 'Permitir que el administrador cree usuarios reales con email, contraseña y rol sin cerrar su propia sesión.',
    reason: 'Firebase Auth desde el cliente cambia la sesión actual si se crea otro usuario directamente.',
    nextStep: 'Crear Cloud Function segura con Firebase Admin SDK.'
  },
  {
    title: 'Importar Excel real .xlsx',
    status: 'futuro',
    description: 'Seleccionar archivos Excel desde el celular y leer hojas reales, no solo texto CSV pegado.',
    reason: 'Requiere dependencias adicionales como document picker y lector XLSX.',
    nextStep: 'Instalar dependencias y probar en build nativo.'
  },
  {
    title: 'Restaurar pagos con recalculo total',
    status: 'delicado',
    description: 'Restaurar pagos desde respaldo y recalcular saldos de todos los créditos automáticamente.',
    reason: 'Un error puede duplicar pagos o alterar saldos históricos.',
    nextStep: 'Crear restauración transaccional con validación previa.'
  },
  {
    title: 'Sincronización offline avanzada',
    status: 'futuro',
    description: 'Guardar operaciones pendientes cuando no haya internet y sincronizarlas después.',
    reason: 'Necesita cola local, control de conflictos y auditoría de reintentos.',
    nextStep: 'Crear módulo de cola offline y pantalla de sincronización.'
  }
];

const backendModules: ModuleItem[] = [
  {
    title: 'Cloud Functions para usuarios',
    status: 'delicado',
    description: 'Función backend para crear usuarios, cambiar contraseñas y asignar roles de forma segura.',
    reason: 'Debe usar Firebase Admin SDK y validación de rol administrador.',
    nextStep: 'Crear carpeta functions y desplegar función HTTPS protegida.'
  },
  {
    title: 'Backups automáticos programados',
    status: 'futuro',
    description: 'Crear respaldos automáticos por día, semana o mes.',
    reason: 'Debe ejecutarse del lado servidor para ser confiable.',
    nextStep: 'Usar Cloud Scheduler o función programada.'
  },
  {
    title: 'Reporte automático por correo',
    status: 'futuro',
    description: 'Enviar resumen diario o semanal al administrador.',
    reason: 'Requiere backend de correo o integración externa.',
    nextStep: 'Definir proveedor de correo y plantilla del reporte.'
  }
];

const mobileModules: ModuleItem[] = [
  {
    title: 'Firma del cliente en recibos',
    status: 'futuro',
    description: 'Capturar firma del cliente al registrar pago y mostrarla en el recibo.',
    reason: 'Requiere componente de firma compatible con React Native.',
    nextStep: 'Instalar librería de firma y probar en APK.'
  },
  {
    title: 'Impresora térmica Bluetooth',
    status: 'delicado',
    description: 'Imprimir recibos directamente en impresora Bluetooth.',
    reason: 'Expo administrado no siempre soporta Bluetooth clásico sin módulo nativo o dev client.',
    nextStep: 'Evaluar impresora, protocolo y librería compatible.'
  },
  {
    title: 'Recibo PDF profesional',
    status: 'futuro',
    description: 'Generar recibo en PDF con logo, datos del negocio, cliente, pago y firma.',
    reason: 'Puede hacerse más seguro que Bluetooth y compartirse por WhatsApp.',
    nextStep: 'Usar generación HTML/PDF y compartir archivo.'
  }
];

const dataModules: ModuleItem[] = [
  {
    title: 'Validador avanzado de importación',
    status: 'futuro',
    description: 'Detectar errores de Excel antes de importar clientes o créditos.',
    reason: 'Ayuda a evitar datos duplicados, fechas malas y valores incorrectos.',
    nextStep: 'Agregar reglas por columna y reporte de errores.'
  },
  {
    title: 'Historial financiero por cliente',
    status: 'futuro',
    description: 'Mostrar línea de tiempo completa del cliente: créditos, pagos, gastos relacionados y estado.',
    reason: 'Mejora el análisis individual de cada cliente.',
    nextStep: 'Crear pantalla de historial del cliente.'
  },
  {
    title: 'Dashboard con gráficas',
    status: 'futuro',
    description: 'Mostrar ventas, cartera, mora, pagos por ruta y caja con gráficas.',
    reason: 'Requiere organizar datos por periodos y rutas.',
    nextStep: 'Agregar tarjetas y gráficos livianos.'
  }
];

const deliveryModules: ModuleItem[] = [
  {
    title: 'APK de prueba completa',
    status: 'pendiente',
    description: 'Generar APK preview para instalar en celular real.',
    reason: 'Ya es el siguiente paso recomendado.',
    nextStep: 'Ejecutar eas build -p android --profile preview.'
  },
  {
    title: 'Prueba con usuarios reales',
    status: 'pendiente',
    description: 'Probar admin, supervisor y cobrador en celular.',
    reason: 'Los permisos deben validarse con cuentas reales.',
    nextStep: 'Crear usuarios en Firebase Auth y asignar roles.'
  },
  {
    title: 'Publicación estable',
    status: 'futuro',
    description: 'Preparar versión final para distribución.',
    reason: 'Después de probar APK preview y corregir errores reales.',
    nextStep: 'Crear build de producción.'
  }
];

export function AdvancedModulesScreen() {
  const { navigate, businessSettings } = useApp();
  const [tab, setTab] = useState<AdvancedTab>('version2');

  const currentItems =
    tab === 'version2'
      ? version2Modules
      : tab === 'backend'
        ? backendModules
        : tab === 'mobile'
          ? mobileModules
          : tab === 'datos'
            ? dataModules
            : deliveryModules;

  const readyCount = currentItems.filter((item) => item.status === 'listo').length;
  const pendingCount = currentItems.filter((item) => item.status === 'pendiente').length;
  const delicateCount = currentItems.filter((item) => item.status === 'delicado').length;
  const futureCount = currentItems.filter((item) => item.status === 'futuro').length;

  return (
    <View style={styles.root}>
      <TopBar title="Modulos avanzados" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{businessSettings.appName || 'CobroApp'} - Proxima version</Text>
          <Text style={styles.heroText}>
            Estos son los modulos que quedan para una version avanzada. No se recomienda agregarlos todos antes de probar la APK actual.
          </Text>
        </Card>

        <View style={styles.grid}>
          <Metric title="Pendientes" value={String(pendingCount)} danger={pendingCount > 0} />
          <Metric title="Delicados" value={String(delicateCount)} danger={delicateCount > 0} />
        </View>

        <View style={styles.grid}>
          <Metric title="Futuros" value={String(futureCount)} />
          <Metric title="Listos" value={String(readyCount)} />
        </View>

        <View style={styles.tabs}>
          <Tab label="Version 2" value="version2" current={tab} onPress={setTab} />
          <Tab label="Backend" value="backend" current={tab} onPress={setTab} />
          <Tab label="Movil" value="mobile" current={tab} onPress={setTab} />
          <Tab label="Datos" value="datos" current={tab} onPress={setTab} />
          <Tab label="Entrega" value="entrega" current={tab} onPress={setTab} />
        </View>

        {currentItems.map((item) => (
          <Card key={item.title} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>{item.title}</Text>
                <Text style={styles.moduleText}>{item.description}</Text>
              </View>

              <StatusBadge type={getStatusType(item.status)} label={getStatusLabel(item.status)} />
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailTitle}>Por que no meterlo de golpe</Text>
              <Text style={styles.detailText}>{item.reason}</Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailTitle}>Siguiente paso</Text>
              <Text style={styles.detailText}>{item.nextStep}</Text>
            </View>
          </Card>
        ))}

        <Card style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>Recomendacion tecnica</Text>
          <Text style={styles.recommendationText}>
            La version actual ya esta lista para APK de prueba. Los modulos delicados deben hacerse uno por uno despues de probar la app en celular real.
          </Text>

          <Button title="Ir a diagnostico final" variant="secondary" onPress={() => navigate('systemChecklist')} style={styles.actionButton} />
          <Button title="Ir a exportar reportes" variant="secondary" onPress={() => navigate('exportReports')} style={styles.actionButton} />
        </Card>
      </Screen>

      <BottomNav />
    </View>
  );
}

function Tab({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: AdvancedTab;
  current: AdvancedTab;
  onPress: (value: AdvancedTab) => void;
}) {
  const selected = value === current;

  return (
    <Pressable style={[styles.chip, selected ? styles.chipSelected : null]} onPress={() => onPress(value)}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function Metric({
  title,
  value,
  danger = false
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, danger ? styles.danger : null]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  heroCard: {
    backgroundColor: colors.primary,
    marginBottom: 12
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  heroText: {
    color: '#FFFFFF',
    opacity: 0.92,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  metricCard: {
    flex: 1
  },
  metricTitle: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  metricValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 20,
    marginTop: 6
  },
  danger: {
    color: colors.danger
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  chipTextSelected: {
    color: colors.primary
  },
  moduleCard: {
    marginBottom: 12
  },
  moduleHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  moduleInfo: {
    flex: 1
  },
  moduleTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  moduleText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  detailBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 12
  },
  detailTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: 5
  },
  detailText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20
  },
  recommendationCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 12
  },
  recommendationTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  recommendationText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  actionButton: {
    marginTop: 12
  }
});