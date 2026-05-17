import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export function CreditsScreen() {
  const { credits, getClientName, navigate, selectCredit, isAdmin } = useApp();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return credits;

    return credits.filter((credit) =>
      [
        getClientName(credit.clienteId),
        credit.estado,
        credit.frecuencia,
        credit.assignedToEmail
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [credits, getClientName, search]);

  return (
    <View style={styles.root}>
      <TopBar title="CrÃ©ditos" rightText={isAdmin ? '+' : undefined} onRightPress={isAdmin ? () => navigate('newCredit') : undefined} />
      <Screen>
        <Input
          label="Buscar crÃ©dito"
          icon="ðŸ”Ž"
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por cliente, estado o cobrador"
        />

        {filtered.length === 0 ? (
          <EmptyState title="Sin crÃ©ditos" message="No hay crÃ©ditos con ese filtro." />
        ) : (
          filtered.map((credit) => {
            const statusType =
              credit.estado === 'pagado'
                ? 'success'
                : credit.estado === 'vencido' || credit.estado === 'anulado' ? 'danger' : 'warning';

            return (
              <Pressable key={credit.id} onPress={() => selectCredit(credit.id)}>
                <Card style={styles.creditCard}>
                  <View style={styles.row}>
                    <View style={styles.info}>
                      <Text style={styles.clientName}>{getClientName(credit.clienteId)}</Text>
                      <Text style={styles.meta}>Prestado: {formatMoney(credit.valorPrestado)}</Text>
                      <Text style={styles.meta}>Total: {formatMoney(credit.valorTotal)}</Text>
                      <Text style={styles.balance}>Saldo: {formatMoney(credit.saldoPendiente)}</Text>
                    </View>

                    <StatusBadge type={statusType} label={credit.estado} />
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Cuota: {formatMoney(credit.valorCuota)}</Text>
                    <Text style={styles.footerText}>{credit.frecuencia}</Text>
                  </View>

                  <Text style={styles.collector}>Cobrador: {credit.assignedToEmail || 'Sin asignar'}</Text>
                  <Text style={styles.openText}>Tocar para ver detalle</Text>
                </Card>
              </Pressable>
            );
          })
        )}

        {isAdmin ? (
          <Button title="Crear nuevo crÃ©dito" onPress={() => navigate('newCredit')} style={styles.button} />
        ) : null}
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
  creditCard: {
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  info: {
    flex: 1
  },
  clientName: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16
  },
  meta: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4
  },
  balance: {
    color: colors.danger,
    fontWeight: '900',
    marginTop: 5
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10
  },
  footerText: {
    color: colors.muted,
    fontWeight: '800'
  },
  collector: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 10
  },
  openText: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4,
    fontSize: 12
  },
  button: {
    marginTop: 10
  }
});