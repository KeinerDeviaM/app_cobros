import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

type HelpTab = 'inicio' | 'admin' | 'cobrador' | 'faq';

type HelpStep = {
  title: string;
  description: string;
};

function openAndroidInstallHelp() {
  Linking.openURL('https://support.google.com/android/answer/2812853');
}

export function HelpScreen() {
  const { navigate, isAdmin, session, businessSettings } = useApp();
  const [tab, setTab] = useState<HelpTab>('inicio');

  const appName = businessSettings.appName || 'App Cobros';

  const adminSteps = useMemo<HelpStep[]>(() => [
    {
      title: '1. Configura el negocio',
      description: 'Entra a Configuración visual y completa nombre del negocio, teléfono, dirección, colores, mensaje del recibo, texto legal y pie de página.'
    },
    {
      title: '2. Crea usuarios cobradores',
      description: 'Desde Usuarios puedes revisar los usuarios registrados, activar o desactivar cuentas y asignar roles de administrador o cobrador.'
    },
    {
      title: '3. Crea rutas',
      description: 'Desde Rutas registra zonas o recorridos. Luego puedes asignar clientes a cada ruta para ordenar mejor la cobranza.'
    },
    {
      title: '4. Crea clientes',
      description: 'Desde Clientes presiona +, registra nombre, documento, teléfono, dirección, barrio, ruta y cobrador asignado.'
    },
    {
      title: '5. Crea créditos',
      description: 'En el detalle de un cliente puedes crear un crédito. Ingresa valor prestado, valor total, número de cuotas, frecuencia y fecha de inicio.'
    },
    {
      title: '6. Revisa pagos y recibos',
      description: 'Cada pago genera un recibo. Puedes compartir el recibo como texto o PDF. Los pagos anulados quedan en auditoría.'
    },
    {
      title: '7. Controla caja diaria',
      description: 'En Caja diaria registra gastos, revisa pagos del día, calcula caja esperada y guarda cierres de caja.'
    },
    {
      title: '8. Usa reportes y respaldo',
      description: 'Desde Reportes, Indicadores avanzados y Respaldo de datos puedes revisar el estado del negocio y exportar información.'
    }
  ], []);

  const collectorSteps = useMemo<HelpStep[]>(() => [
    {
      title: '1. Inicia sesión',
      description: 'El cobrador debe entrar con su correo y contraseña. Solo verá los clientes, créditos, pagos y visitas asignados a su usuario.'
    },
    {
      title: '2. Revisa clientes asignados',
      description: 'En Clientes puedes consultar datos de contacto, dirección, estado, créditos y pagos del cliente.'
    },
    {
      title: '3. Consulta la agenda',
      description: 'En Calendario de cobros puedes ver cuotas para hoy, vencidas, próximas de la semana y promesas de pago.'
    },
    {
      title: '4. Registra pagos',
      description: 'En el detalle del crédito toca Registrar pago, ingresa valor, método, fecha y observación. La app actualiza el saldo automáticamente.'
    },
    {
      title: '5. Comparte el recibo',
      description: 'Después de registrar un pago, comparte el recibo por texto o genera el PDF para enviarlo por WhatsApp.'
    },
    {
      title: '6. Gestiona visitas',
      description: 'En Visitas marca si el cliente fue visitado, pagó, no pagó, no estaba o hizo una promesa de pago.'
    },
    {
      title: '7. Registra promesas',
      description: 'Si el cliente promete pagar, registra fecha prometida, valor prometido y observación. Luego podrás hacer seguimiento desde Promesas de pago.'
    },
    {
      title: '8. Cierra caja',
      description: 'Al terminar la jornada, entra a Caja diaria, revisa pagos y gastos, escribe la caja entregada y guarda el cierre.'
    }
  ], []);

  const faq = useMemo<HelpStep[]>(() => [
    {
      title: '¿La APK necesita el computador encendido?',
      description: 'No. Una vez instalada la APK, la app funciona sin Expo Go y sin el computador. Solo necesita internet para sincronizar con Firebase.'
    },
    {
      title: '¿La información se actualiza en todos los celulares?',
      description: 'Sí. Como los datos están en Firebase, cuando un usuario registra pagos, clientes o cierres, los demás dispositivos reciben la información.'
    },
    {
      title: '¿Qué pasa si anulo un pago?',
      description: 'El pago no se borra. Queda marcado como anulado, se ajusta el saldo del crédito y se guarda un registro en auditoría.'
    },
    {
      title: '¿Qué pasa si anulo un crédito?',
      description: 'El crédito queda en estado anulado, su saldo pasa a cero y deja de sumar en cartera. El historial se conserva.'
    },
    {
      title: '¿Qué pasa si anulo un gasto?',
      description: 'El gasto queda marcado como anulado y ya no resta en caja. También queda registrado en auditoría.'
    },
    {
      title: '¿Quién puede ver reportes y respaldo?',
      description: 'Las secciones sensibles como reportes, indicadores, usuarios, auditoría y respaldo están pensadas para el administrador.'
    },
    {
      title: '¿Qué hago si Android no deja instalar la APK?',
      description: 'Debes permitir instalación de apps desconocidas para el navegador o administrador de archivos desde donde abriste el APK.'
    },
    {
      title: '¿Qué hago antes de entregar una APK nueva?',
      description: 'Ejecuta npm run typecheck, npx expo-doctor, sube cambios a GitHub, aumenta versionCode y genera una APK nueva con EAS.'
    }
  ], []);

  return (
    <View style={styles.root}>
      <TopBar title="Ayuda y manual" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Manual de {appName}</Text>
          <Text style={styles.heroText}>
            Guía rápida para usar la app de cobranza correctamente.
          </Text>
          <Text style={styles.heroMeta}>
            Sesión actual: {session.email} · Rol: {isAdmin ? 'Administrador' : 'Cobrador'}
          </Text>
        </Card>

        <View style={styles.tabs}>
          <HelpTabButton label="Inicio" value="inicio" current={tab} onPress={setTab} />
          <HelpTabButton label="Admin" value="admin" current={tab} onPress={setTab} />
          <HelpTabButton label="Cobrador" value="cobrador" current={tab} onPress={setTab} />
          <HelpTabButton label="FAQ" value="faq" current={tab} onPress={setTab} />
        </View>

        {tab === 'inicio' ? (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Flujo recomendado</Text>

              <ManualRow number="1" title="Configurar negocio" description="Define datos, colores y textos del recibo." />
              <ManualRow number="2" title="Crear rutas y clientes" description="Organiza la cartera por zonas y cobradores." />
              <ManualRow number="3" title="Crear créditos" description="Define valor, cuotas, frecuencia y fecha inicial." />
              <ManualRow number="4" title="Registrar pagos" description="Actualiza saldos y genera recibos." />
              <ManualRow number="5" title="Gestionar visitas" description="Controla cobros diarios y promesas." />
              <ManualRow number="6" title="Cerrar caja" description="Compara pagos, gastos y dinero entregado." />
              <ManualRow number="7" title="Revisar reportes" description="Analiza cartera, cobradores, rutas y caja." />
              <ManualRow number="8" title="Respaldar datos" description="Exporta una copia JSON del negocio." />
            </Card>

            <Card style={styles.warningCard}>
              <Text style={styles.warningTitle}>Recomendación antes de cada APK</Text>
              <Text style={styles.warningText}>1. Ejecuta npm run typecheck.</Text>
              <Text style={styles.warningText}>2. Ejecuta npx expo-doctor.</Text>
              <Text style={styles.warningText}>3. Sube cambios a GitHub.</Text>
              <Text style={styles.warningText}>4. Aumenta versionCode en app.json.</Text>
              <Text style={styles.warningText}>5. Genera APK con eas build -p android --profile preview.</Text>
            </Card>

            <Button title="Ver ayuda de instalación Android" variant="secondary" onPress={openAndroidInstallHelp} />
          </>
        ) : null}

        {tab === 'admin' ? (
          <>
            <Text style={styles.blockTitle}>Manual del administrador</Text>
            {adminSteps.map((step) => (
              <HelpCard key={step.title} step={step} />
            ))}
          </>
        ) : null}

        {tab === 'cobrador' ? (
          <>
            <Text style={styles.blockTitle}>Manual del cobrador</Text>
            {collectorSteps.map((step) => (
              <HelpCard key={step.title} step={step} />
            ))}
          </>
        ) : null}

        {tab === 'faq' ? (
          <>
            <Text style={styles.blockTitle}>Preguntas frecuentes</Text>
            {faq.map((step) => (
              <HelpCard key={step.title} step={step} />
            ))}
          </>
        ) : null}
      </Screen>

      <BottomNav />
    </View>
  );
}

function HelpTabButton({
  label,
  value,
  current,
  onPress
}: {
  label: string;
  value: HelpTab;
  current: HelpTab;
  onPress: (value: HelpTab) => void;
}) {
  const selected = value === current;

  return (
    <Pressable style={[styles.tabButton, selected ? styles.tabButtonSelected : null]} onPress={() => onPress(value)}>
      <Text style={[styles.tabText, selected ? styles.tabTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function ManualRow({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.manualRow}>
      <View style={styles.numberBox}>
        <Text style={styles.numberText}>{number}</Text>
      </View>

      <View style={styles.manualInfo}>
        <Text style={styles.manualTitle}>{title}</Text>
        <Text style={styles.manualDescription}>{description}</Text>
      </View>
    </View>
  );
}

function HelpCard({ step }: { step: HelpStep }) {
  return (
    <Card style={styles.helpCard}>
      <Text style={styles.helpTitle}>{step.title}</Text>
      <Text style={styles.helpDescription}>{step.description}</Text>
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
    fontSize: 21,
    fontWeight: '900'
  },
  heroText: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  heroMeta: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 12,
    fontWeight: '800'
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  tabButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  tabButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  tabText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12
  },
  tabTextSelected: {
    color: colors.primary
  },
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 12
  },
  manualRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14
  },
  numberBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  numberText: {
    color: colors.primary,
    fontWeight: '900'
  },
  manualInfo: {
    flex: 1
  },
  manualTitle: {
    color: colors.text,
    fontWeight: '900'
  },
  manualDescription: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 14
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 8
  },
  warningText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 3
  },
  blockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10
  },
  helpCard: {
    marginBottom: 10
  },
  helpTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  helpDescription: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 7
  }
});