import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { todayKey } from '../utils/date';

type GuideTab = 'plantillas' | 'campos' | 'admin' | 'supervisor' | 'cobrador' | 'checklist';

const clientsTemplate = `nombre,telefono,direccion,ruta,nota
Juan Perez,3001234567,Calle 10 # 5-20,Ruta Centro,Cliente nuevo
Maria Lopez,3009876543,Carrera 7 # 12-30,Ruta Norte,Referida`;

const creditsTemplate = `cliente,telefono,valorPrestado,valorTotal,cuotas,frecuencia,fechaInicio,fechaFinal,porcentaje,nota,codeudorNombre,codeudorTelefono,codeudorCpf
Juan Perez,3001234567,100000,120000,12,Diaria,2026-05-19,2026-05-31,20,Credito inicial,Pedro Perez,3005555555,123456789
Maria Lopez,3009876543,200000,260000,13,Semanal,2026-05-19,2026-08-19,30,Credito semanal,,,`;

const paymentsReferenceTemplate = `cliente,telefono,creditoId,valorPagado,metodoPago,fechaPago,nota
Juan Perez,3001234567,credito-123,20000,Efectivo,2026-05-19,Pago normal
Maria Lopez,3009876543,credito-456,50000,Transferencia,2026-05-19,Pago parcial`;

const manualText = `MANUAL RAPIDO COBROAPP

ROLES

Administrador:
Puede gestionar usuarios, roles, rutas, clientes, creditos, pagos, gastos, caja, reportes, auditoria, respaldo, importacion y configuracion.

Supervisor:
Puede revisar la operacion, validar caja, ver reportes, editar pagos y anular pagos con auditoria.

Cobrador:
Puede ver su ruta, registrar pagos, registrar gastos, crear visitas, registrar promesas y cerrar caja. No puede editar ni anular pagos.

FLUJO RECOMENDADO

1. Crear rutas.
2. Crear o importar clientes.
3. Crear o importar creditos.
4. Registrar pagos.
5. Registrar gastos de ruta.
6. Revisar caja diaria.
7. Exportar reporte general o filtrado.
8. Revisar auditoria cuando haya cambios sensibles.

IMPORTACION DE CLIENTES

Formato:
nombre,telefono,direccion,ruta,nota

Reglas:
El nombre es obligatorio.
El telefono es obligatorio.
La direccion es obligatoria.
La ruta debe coincidir con una ruta existente si quieres asociarla automaticamente.
La nota es opcional.
El sistema evita duplicados por nombre o telefono.

IMPORTACION DE CREDITOS

Formato:
cliente,telefono,valorPrestado,valorTotal,cuotas,frecuencia,fechaInicio,fechaFinal,porcentaje,nota,codeudorNombre,codeudorTelefono,codeudorCpf

Reglas:
El cliente debe existir antes de importar el credito.
El valor total no puede ser menor que el valor prestado.
Las cuotas deben ser mayores que cero.
La fecha debe ir en formato YYYY-MM-DD.
La frecuencia puede ser Diaria, Semanal, Quincenal, Mensual o Personalizada.
El codeudor es opcional.

EXPORTACION

Exportar todo general:
Saca toda la informacion historica de la aplicacion.

Exportar reporte filtrado:
Permite filtrar por fecha, ruta, cobrador, metodo de pago, cliente o estado del credito.

CAJA

La caja muestra:
Estimado a cobrar.
Total cobrado en efectivo.
Total cobrado por transferencia.
Gastos.
Caja esperada.
Caja entregada.
Diferencia.
Historial de pagos y gastos.

SEGURIDAD

No se eliminan pagos, creditos ni gastos sensibles.
Los pagos se anulan o editan con auditoria.
La auditoria no se modifica ni se borra.`;

export function TemplatesManualScreen() {
  const { navigate, businessSettings } = useApp();
  const [tab, setTab] = useState<GuideTab>('plantillas');

  const shareTextFile = async (name: string, content: string) => {
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert('Compartir no disponible', 'Este dispositivo no permite compartir archivos.');
      return;
    }

    const uri = `${FileSystem.cacheDirectory}${name}`;

    await FileSystem.writeAsStringAsync(uri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });

    await Sharing.shareAsync(uri, {
      mimeType: name.endsWith('.csv') ? 'text/csv' : 'text/plain',
      dialogTitle: name
    });
  };

  return (
    <View style={styles.root}>
      <TopBar title="Plantillas y manual" showBack onBack={() => navigate('more')} />

      <Screen>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{businessSettings.appName || 'CobroApp'} - Guia de uso</Text>
          <Text style={styles.heroText}>
            Descarga plantillas CSV, revisa campos obligatorios y consulta el manual rapido por rol.
          </Text>
        </Card>

        <View style={styles.tabs}>
          <Tab label="Plantillas" value="plantillas" current={tab} onPress={setTab} />
          <Tab label="Campos" value="campos" current={tab} onPress={setTab} />
          <Tab label="Admin" value="admin" current={tab} onPress={setTab} />
          <Tab label="Supervisor" value="supervisor" current={tab} onPress={setTab} />
          <Tab label="Cobrador" value="cobrador" current={tab} onPress={setTab} />
          <Tab label="Checklist" value="checklist" current={tab} onPress={setTab} />
        </View>

        {tab === 'plantillas' ? (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Plantilla de clientes</Text>
              <Text style={styles.text}>Columnas: nombre, telefono, direccion, ruta, nota.</Text>
              <Text style={styles.code}>{clientsTemplate}</Text>
              <Button title="Compartir plantilla clientes CSV" onPress={() => shareTextFile(`plantilla-clientes-${todayKey()}.csv`, clientsTemplate)} />
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Plantilla de creditos</Text>
              <Text style={styles.text}>Columnas para importar creditos con codeudor opcional.</Text>
              <Text style={styles.code}>{creditsTemplate}</Text>
              <Button title="Compartir plantilla creditos CSV" onPress={() => shareTextFile(`plantilla-creditos-${todayKey()}.csv`, creditsTemplate)} />
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Referencia de pagos</Text>
              <Text style={styles.text}>Esta plantilla es solo de referencia para entender los datos de pagos exportados.</Text>
              <Text style={styles.code}>{paymentsReferenceTemplate}</Text>
              <Button title="Compartir referencia pagos CSV" variant="secondary" onPress={() => shareTextFile(`referencia-pagos-${todayKey()}.csv`, paymentsReferenceTemplate)} />
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Manual completo</Text>
              <Text style={styles.text}>Exporta un archivo TXT con el manual rapido de operacion.</Text>
              <Button title="Compartir manual TXT" variant="secondary" onPress={() => shareTextFile(`manual-cobroapp-${todayKey()}.txt`, manualText)} />
            </Card>
          </>
        ) : null}

        {tab === 'campos' ? (
          <>
            <GuideCard
              title="Clientes"
              items={[
                'nombre: obligatorio. Nombre completo del cliente.',
                'telefono: obligatorio. Numero del cliente.',
                'direccion: obligatorio. Lugar donde se ubica el cliente.',
                'ruta: opcional. Debe coincidir con una ruta existente.',
                'nota: opcional. Observacion interna.'
              ]}
            />

            <GuideCard
              title="Creditos"
              items={[
                'cliente: obligatorio. Debe existir en clientes.',
                'telefono: recomendado para encontrar el cliente.',
                'valorPrestado: obligatorio. Dinero entregado al cliente.',
                'valorTotal: obligatorio. Total que debe pagar.',
                'cuotas: obligatorio. Cantidad de cuotas.',
                'frecuencia: Diaria, Semanal, Quincenal, Mensual o Personalizada.',
                'fechaInicio: obligatorio. Formato YYYY-MM-DD.',
                'fechaFinal: opcional. Formato YYYY-MM-DD.',
                'porcentaje: opcional.',
                'nota: opcional.',
                'codeudorNombre, codeudorTelefono, codeudorCpf: opcionales.'
              ]}
            />

            <GuideCard
              title="Reglas para evitar errores"
              items={[
                'No dejes columnas obligatorias vacias.',
                'Usa fechas en formato YYYY-MM-DD.',
                'No uses puntos ni simbolos en valores numericos.',
                'Antes de importar creditos, importa primero los clientes.',
                'Revisa duplicados por nombre y telefono.',
                'Si una ruta no existe, creala antes de importar clientes.'
              ]}
            />
          </>
        ) : null}

        {tab === 'admin' ? (
          <GuideCard
            title="Manual rapido administrador"
            items={[
              'Crear y revisar rutas.',
              'Crear o importar clientes.',
              'Crear o importar creditos.',
              'Asignar roles a usuarios.',
              'Revisar pagos editados o anulados.',
              'Revisar auditoria.',
              'Exportar reporte general.',
              'Exportar reportes filtrados.',
              'Revisar caja diaria.',
              'Actualizar configuracion del negocio.',
              'Generar respaldo.'
            ]}
          />
        ) : null}

        {tab === 'supervisor' ? (
          <GuideCard
            title="Manual rapido supervisor"
            items={[
              'Revisar rutas y clientes.',
              'Supervisar pagos del dia.',
              'Editar pagos cuando haya error.',
              'Anular pagos cuando sea necesario.',
              'Revisar caja por ruta.',
              'Revisar gastos del cobrador.',
              'Exportar reportes filtrados.',
              'Consultar auditoria de pagos.',
              'Validar diferencias de caja.'
            ]}
          />
        ) : null}

        {tab === 'cobrador' ? (
          <GuideCard
            title="Manual rapido cobrador"
            items={[
              'Ver clientes asignados.',
              'Ver ruta del dia.',
              'Registrar pagos recibidos.',
              'Generar recibo.',
              'Registrar gastos de ruta.',
              'Registrar visitas.',
              'Registrar promesas de pago.',
              'Cerrar caja diaria.',
              'No editar pagos.',
              'No anular pagos.',
              'Reportar errores al supervisor o administrador.'
            ]}
          />
        ) : null}

        {tab === 'checklist' ? (
          <>
            <GuideCard
              title="Checklist antes de importar"
              items={[
                'Crear las rutas necesarias.',
                'Revisar que los nombres de ruta coincidan.',
                'Importar clientes primero.',
                'Revisar duplicados de clientes.',
                'Importar creditos despues.',
                'Verificar valores prestados y totales.',
                'Verificar fechas.',
                'Verificar cuotas.',
                'Revisar clientes con credito activo antes de importar otro.'
              ]}
            />

            <GuideCard
              title="Checklist antes de entregar APK"
              items={[
                'Probar login admin.',
                'Probar login supervisor.',
                'Probar login cobrador.',
                'Crear cliente.',
                'Crear credito con codeudor.',
                'Registrar pago.',
                'Editar pago como supervisor/admin.',
                'Anular pago como supervisor/admin.',
                'Verificar que cobrador no edite ni anule pagos.',
                'Registrar gasto.',
                'Cerrar caja.',
                'Exportar todo general.',
                'Exportar reporte filtrado.',
                'Importar clientes CSV.',
                'Importar creditos CSV.',
                'Revisar auditoria.',
                'Ejecutar typecheck y expo-doctor.'
              ]}
            />
          </>
        ) : null}
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
  value: GuideTab;
  current: GuideTab;
  onPress: (value: GuideTab) => void;
}) {
  const selected = value === current;

  return (
    <Pressable style={[styles.chip, selected ? styles.chipSelected : null]} onPress={() => onPress(value)}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function GuideCard({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={`${title}-${index}`} style={styles.listItem}>
          <Text style={styles.bullet}>{index + 1}</Text>
          <Text style={styles.listText}>{item}</Text>
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
  sectionCard: {
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 10
  },
  text: {
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 10
  },
  code: {
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10
  },
  bullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '900'
  },
  listText: {
    flex: 1,
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20
  }
});