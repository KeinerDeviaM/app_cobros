import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

type MenuItem = {
  title: string;
  screen: string;
  description: string;
  adminOnly?: boolean;
  supervisorAllowed?: boolean;
};

export function MoreScreen() {
  const app = useApp() as any;

  const {
    session,
    navigate,
    logout,
    isAdmin,
    isSupervisor,
    canManagePayments,
    businessSettings
  } = app;

  const canSeeAdminTools = Boolean(isAdmin || isSupervisor || canManagePayments);

  const operationItems: MenuItem[] = [
    {
      title: 'Clientes',
      screen: 'clients',
      description: 'Gestionar clientes, datos personales, ruta y estado.'
    },
    {
      title: 'Creditos',
      screen: 'credits',
      description: 'Ver creditos activos, pagados, vencidos y anulados.'
    },
    {
      title: 'Pagos',
      screen: 'payments',
      description: 'Consultar pagos, registrar pagos y revisar movimientos.'
    },
    {
      title: 'Rutas',
      screen: 'routes',
      description: 'Ver clientes, creditos, pagos y gastos por ruta.'
    },
    {
      title: 'Caja diaria',
      screen: 'dailyCash',
      description: 'Cerrar caja, revisar efectivo, transferencias y gastos.'
    }
  ];

  const adminItems: MenuItem[] = [
    {
      title: 'Usuarios y roles',
      screen: 'users',
      description: 'Administrar admin, supervisor y cobrador.',
      adminOnly: true
    },
    {
      title: 'Control operativo',
      screen: 'operationalControl',
      description: 'Resumen operativo de rutas, caja, creditos, pagos y gastos.',
      supervisorAllowed: true
    },
    {
      title: 'Auditoria avanzada',
      screen: 'auditLog',
      description: 'Revisar pagos editados, anulados y cambios sensibles.',
      supervisorAllowed: true
    }
  ];

  const dataItems: MenuItem[] = [
    {
      title: 'Exportar reportes',
      screen: 'exportReports',
      description: 'Exportar todo general o reportes filtrados para Excel.',
      supervisorAllowed: true
    },
    {
      title: 'Importar clientes',
      screen: 'importClients',
      description: 'Importar clientes desde Excel o CSV.',
      supervisorAllowed: true
    },
    {
      title: 'Importar creditos',
      screen: 'importCredits',
      description: 'Importar creditos desde Excel o CSV.',
      supervisorAllowed: true
    },
    {
      title: 'Respaldo de datos',
      screen: 'dataBackup',
      description: 'Crear copia de seguridad de la informacion.',
      supervisorAllowed: true
    },
    {
      title: 'Restaurar respaldo',
      screen: 'restoreBackup',
      description: 'Restaurar datos compatibles desde JSON.',
      adminOnly: true
    }
  ];

  const helpItems: MenuItem[] = [
    {
      title: 'Modulos avanzados',
      screen: 'advancedModules',
      description: 'Ver modulos pendientes para version 2, backend, movil y entrega.',
      supervisorAllowed: true
    },
    {
      title: 'Plantillas y manual',
      screen: 'templatesManual',
      description: 'Guia de uso, plantillas CSV y checklist de importacion.'
    },
    {
      title: 'Diagnostico final',
      screen: 'systemChecklist',
      description: 'Revisar si el sistema esta listo para generar APK.',
      supervisorAllowed: true
    },
    {
      title: 'Recordatorios',
      screen: 'reminders',
      description: 'Consultar recordatorios y promesas de pago.'
    }
  ];

  const settingsItems: MenuItem[] = [
    {
      title: 'Configuracion negocio',
      screen: 'businessSettings',
      description: 'Nombre, colores, datos del negocio y recibos.',
      adminOnly: true
    },
    {
      title: 'Notificaciones',
      screen: 'notifications',
      description: 'Configurar y revisar notificaciones.',
      supervisorAllowed: true
    }
  ];

  return (
    <View style={styles.root}>
      <TopBar title="Mas opciones" />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{businessSettings?.appName || 'CobroApp'}</Text>
          <Text style={styles.heroText}>Panel organizado de operacion, administracion, reportes, respaldo y ayuda.</Text>
          <View style={styles.sessionBox}>
            <Text style={styles.sessionText}>Usuario: {session?.email || 'Sin sesion'}</Text>
            <Text style={styles.sessionText}>Rol: {session?.role || 'No definido'}</Text>
          </View>
        </Card>

        <MenuSection
          title="Operacion"
          subtitle="Modulos principales para trabajar el dia a dia."
          items={operationItems}
          navigate={navigate}
          isAdmin={isAdmin}
          isSupervisor={isSupervisor}
          canSeeAdminTools={canSeeAdminTools}
        />

        {canSeeAdminTools ? (
          <MenuSection
            title="Administracion"
            subtitle="Herramientas para controlar usuarios, auditoria y operacion."
            items={adminItems}
            navigate={navigate}
            isAdmin={isAdmin}
            isSupervisor={isSupervisor}
            canSeeAdminTools={canSeeAdminTools}
          />
        ) : null}

        <MenuSection
          title="Reportes y datos"
          subtitle="Exportar, importar, respaldar y restaurar informacion."
          items={dataItems}
          navigate={navigate}
          isAdmin={isAdmin}
          isSupervisor={isSupervisor}
          canSeeAdminTools={canSeeAdminTools}
        />

        <MenuSection
          title="Ayuda y entrega"
          subtitle="Manual, plantillas, diagnostico y soporte operativo."
          items={helpItems}
          navigate={navigate}
          isAdmin={isAdmin}
          isSupervisor={isSupervisor}
          canSeeAdminTools={canSeeAdminTools}
        />

        {canSeeAdminTools ? (
          <MenuSection
            title="Configuracion"
            subtitle="Ajustes del negocio y funciones adicionales."
            items={settingsItems}
            navigate={navigate}
            isAdmin={isAdmin}
            isSupervisor={isSupervisor}
            canSeeAdminTools={canSeeAdminTools}
          />
        ) : null}

        <Card style={styles.logoutCard}>
          <Text style={styles.logoutTitle}>Sesion</Text>
          <Text style={styles.logoutText}>Cierra sesion cuando termines de usar la aplicacion en este dispositivo.</Text>
          <Button title="Cerrar sesion" variant="danger" onPress={logout} style={styles.logoutButton} />
        </Card>
      </Screen>

      <BottomNav />
    </View>
  );
}

function MenuSection({
  title,
  subtitle,
  items,
  navigate,
  isAdmin,
  isSupervisor,
  canSeeAdminTools
}: {
  title: string;
  subtitle: string;
  items: MenuItem[];
  navigate: (screen: any) => void;
  isAdmin: boolean;
  isSupervisor: boolean;
  canSeeAdminTools: boolean;
}) {
  const visibleItems = items.filter((item) => {
    if (item.adminOnly) return Boolean(isAdmin);
    if (item.supervisorAllowed) return Boolean(isAdmin || isSupervisor || canSeeAdminTools);
    return true;
  });

  if (visibleItems.length === 0) return null;

  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>

      {visibleItems.map((item) => (
        <View key={item.screen} style={styles.menuItem}>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
          </View>

          <Button title="Abrir" variant="secondary" onPress={() => navigate(item.screen as any)} style={styles.openButton} />
        </View>
      ))}
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
    fontSize: 24,
    fontWeight: '900'
  },
  heroText: {
    color: '#FFFFFF',
    opacity: 0.92,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '700'
  },
  sessionBox: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    padding: 12,
    marginTop: 12
  },
  sessionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 3
  },
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900'
  },
  sectionSubtitle: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 10
  },
  menuItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    gap: 10
  },
  menuInfo: {
    flex: 1
  },
  menuTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  menuDescription: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4
  },
  openButton: {
    marginTop: 2
  },
  logoutCard: {
    backgroundColor: '#FFF5F5',
    marginBottom: 12
  },
  logoutTitle: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '900'
  },
  logoutText: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6
  },
  logoutButton: {
    marginTop: 12
  }
});