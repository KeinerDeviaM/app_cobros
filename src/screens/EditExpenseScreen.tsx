import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/money';
import { isPositiveMoney, isValidDateKey, parseMoney } from '../utils/validation';

export function EditExpenseScreen() {
  const {
    selectedExpense,
    updateExpense,
    cancelExpense,
    navigate,
    session,
    isAdmin
  } = useApp();

  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedExpense) return;

    setDescripcion(selectedExpense.descripcion);
    setValor(String(selectedExpense.valor));
    setFecha(selectedExpense.fecha);
  }, [selectedExpense]);

  if (!selectedExpense) {
    return (
      <View style={styles.root}>
        <TopBar title="Editar gasto" showBack onBack={() => navigate('dailyCash')} />
        <Screen>
          <EmptyState title="Gasto no encontrado" message="Vuelve a caja diaria y selecciona un gasto." />
          <Button title="Volver a caja diaria" onPress={() => navigate('dailyCash')} />
        </Screen>
        <BottomNav />
      </View>
    );
  }

  const canManage = isAdmin || selectedExpense.createdBy === session.email;
  const isCanceled = selectedExpense.estado === 'anulado';

  const handleSave = async () => {
    if (!canManage) {
      Alert.alert('Acceso restringido', 'Solo puedes editar gastos creados por tu usuario.');
      return;
    }

    if (isCanceled) {
      Alert.alert('Gasto anulado', 'No puedes editar un gasto anulado.');
      return;
    }

    const amount = parseMoney(valor);

    if (!descripcion.trim()) {
      Alert.alert('Descripcion requerida', 'Escribe la descripcion del gasto.');
      return;
    }

    if (!isPositiveMoney(amount)) {
      Alert.alert('Valor invalido', 'El valor debe ser mayor que cero.');
      return;
    }

    if (!isValidDateKey(fecha)) {
      Alert.alert('Fecha invalida', 'La fecha debe tener formato YYYY-MM-DD.');
      return;
    }

    setLoading(true);

    await updateExpense(selectedExpense.id, {
      descripcion: descripcion.trim(),
      valor: amount,
      fecha
    });

    setLoading(false);
  };

  const confirmCancel = () => {
    if (!canManage) {
      Alert.alert('Acceso restringido', 'Solo puedes anular gastos creados por tu usuario.');
      return;
    }

    if (isCanceled) {
      Alert.alert('Gasto ya anulado', 'Este gasto ya fue anulado anteriormente.');
      return;
    }

    Alert.alert(
      'Anular gasto',
      'Esta accion no borra el gasto: lo marcara como anulado y dejara de restar en caja. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: () => cancelExpense(selectedExpense.id, 'Anulacion manual desde editar gasto')
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar title="Editar gasto" showBack onBack={() => navigate('dailyCash')} />

      <Screen>
        <Card style={isCanceled ? styles.canceledCard : styles.infoCard}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.infoTitle}>Gasto registrado</Text>
              <Text style={styles.infoText}>Creado por: {selectedExpense.createdBy || 'No registrado'}</Text>
              <Text style={styles.infoText}>Valor actual: {formatMoney(selectedExpense.valor)}</Text>
            </View>

            <StatusBadge type={isCanceled ? 'danger' : 'success'} label={isCanceled ? 'Anulado' : 'Activo'} />
          </View>

          {isCanceled ? (
            <View style={styles.cancelBox}>
              <Text style={styles.cancelText}>Anulado por: {selectedExpense.anuladoPor || 'No registrado'}</Text>
              <Text style={styles.cancelText}>Fecha: {selectedExpense.anuladoEn || 'No registrada'}</Text>
              <Text style={styles.cancelText}>Motivo: {selectedExpense.motivoAnulacion || 'Sin motivo'}</Text>
            </View>
          ) : null}
        </Card>

        <Input
          label="Descripcion"
          icon="🧾"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Ej: Gasolina, transporte, papeleria"
        />

        <Input
          label="Valor"
          icon="💸"
          value={valor}
          onChangeText={setValor}
          keyboardType="numeric"
          placeholder="Ej: 10000"
        />

        <Input
          label="Fecha"
          icon="📅"
          value={fecha}
          onChangeText={setFecha}
          placeholder="YYYY-MM-DD"
        />

        {!canManage ? (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>Sin permisos</Text>
            <Text style={styles.warningText}>Este gasto fue creado por otro usuario. Solo el administrador puede modificarlo.</Text>
          </Card>
        ) : null}

        {!isCanceled ? (
          <>
            <Button title="Guardar cambios" onPress={handleSave} loading={loading} />
            <Button title="Anular gasto" variant="danger" onPress={confirmCancel} style={styles.button} />
          </>
        ) : (
          <Button title="Volver a caja diaria" onPress={() => navigate('dailyCash')} />
        )}
      </Screen>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  infoCard: {
    backgroundColor: colors.primarySoft,
    marginBottom: 16
  },
  canceledCard: {
    backgroundColor: '#FFF5F5',
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  headerText: {
    flex: 1
  },
  infoTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900'
  },
  infoText: {
    color: colors.muted,
    marginTop: 5,
    fontWeight: '700'
  },
  cancelBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12
  },
  cancelText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
    marginBottom: 14
  },
  warningTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  warningText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 20
  },
  button: {
    marginTop: 10
  }
});
