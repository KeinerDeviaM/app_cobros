import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

export function PreApkChecklistScreen() {
  const {
    clients,
    credits,
    payments,
    users,
    routes,
    visits,
    businessSettings,
    navigate
  } = useApp();

  const activeCollectors = users.filter((user) => user.role === 'cobrador' && user.activo).length;
  const activePayments = payments.filter((payment) => payment.estado !== 'anulado').length;
  const canceledPayments = payments.filter((payment) => payment.estado === 'anulado').length;

  const checks = [
    {
      title: 'Configuración del negocio',
      ok: Boolean(businessSettings.businessName && businessSettings.businessName !== 'CobroApp'),
      detail: businessSettings.businessName || 'Sin configurar'
    },
    {
      title: 'Usuarios cobradores',
      ok: activeCollectors > 0,
      detail: `${activeCollectors} cobradores activos`
    },
    {
      title: 'Clientes registrados',
      ok: clients.length > 0,
      detail: `${clients.length} clientes`
    },
    {
      title: 'Créditos creados',
      ok: credits.length > 0,
      detail: `${credits.length} créditos`
    },
    {
      title: 'Pagos registrados',
      ok: activePayments > 0,
      detail: `${activePayments} pagos activos`
    },
    {
      title: 'Rutas creadas',
      ok: routes.length > 0,
      detail: `${routes.length} rutas`
    },
    {
      title: 'Visitas generadas',
      ok: visits.length > 0,
      detail: `${visits.length} visitas`
    },
    {
      title: 'Anulación de pagos probada',
      ok: canceledPayments > 0,
      detail: `${canceledPayments} pagos anulados`
    }
  ];

  const readyCount = checks.filter((check) => check.ok).length;
  const progress = Math.round((readyCount / checks.length) * 100);

  return (
    <View style={styles.root}>
      <TopBar title="Checklist APK" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.title}>Preparación antes del APK</Text>
          <Text style={styles.subtitle}>
            Revisa estos puntos antes de generar la APK privada para Android.
          </Text>

          <View style={styles.progressBox}>
            <Text style={styles.progressValue}>{progress}%</Text>
            <Text style={styles.progressText}>{readyCount} de {checks.length} puntos listos</Text>
          </View>
        </Card>

        {checks.map((check) => (
          <Card key={check.title} style={styles.checkCard}>
            <View style={styles.checkHeader}>
              <View style={styles.checkInfo}>
                <Text style={styles.checkTitle}>{check.title}</Text>
                <Text style={styles.checkDetail}>{check.detail}</Text>
              </View>

              <StatusBadge type={check.ok ? 'success' : 'warning'} label={check.ok ? 'Listo' : 'Pendiente'} />
            </View>
          </Card>
        ))}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Prueba recomendada con dos celulares</Text>

          <ChecklistText text="1. Entra como administrador en un celular." />
          <ChecklistText text="2. Entra como cobrador en otro celular." />
          <ChecklistText text="3. Crea o edita un cliente desde admin." />
          <ChecklistText text="4. Asigna ese cliente al cobrador." />
          <ChecklistText text="5. Registra un pago desde cobrador." />
          <ChecklistText text="6. Verifica que el admin vea el pago." />
          <ChecklistText text="7. Anula un pago desde admin y revisa el saldo." />
          <ChecklistText text="8. Cierra caja desde cobrador y revisa el cierre desde admin." />
        </Card>

        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Importante</Text>
          <Text style={styles.warningText}>
            Genera el APK cuando el login, pagos, recibos, caja, cierre, reportes, auditoría y exportación funcionen correctamente.
          </Text>
        </Card>
      </Screen>

      <BottomNav />
    </View>
  );
}

function ChecklistText({ text }: { text: string }) {
  return <Text style={styles.checklistText}>{text}</Text>;
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
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900'
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  progressBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    alignItems: 'center'
  },
  progressValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900'
  },
  progressText: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 4
  },
  checkCard: {
    marginBottom: 10
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  checkInfo: {
    flex: 1
  },
  checkTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15
  },
  checkDetail: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  sectionCard: {
    marginTop: 8,
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 10
  },
  checklistText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 12
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  warningText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  }
});