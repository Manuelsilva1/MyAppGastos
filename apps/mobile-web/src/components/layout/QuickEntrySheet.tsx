import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Delete } from 'lucide-react-native';
import { AmountText, BottomSheet, Chip, getIcon } from '../ui';
import { appendKey, isZero, toMoneyString, type MoneyKey } from '../../features/quick-entry/amountInput';
import { useAccounts, useCategories } from '../../features/transactions/useCatalog';
import { randomUUID, useSaveTransaction, useVoidTransaction } from '../../features/transactions/useSaveTransaction';
import { ApiError } from '../../lib/api';
import { IS_DEMO } from '../../lib/config';
import { useThemeColors } from '../../theme';

type Kind = 'EXPENSE' | 'INCOME' | 'TRANSFER';

const KIND_LABEL: Record<Kind, string> = { EXPENSE: 'Gasto', INCOME: 'Ingreso', TRANSFER: 'Transferencia' };
const KEYS: MoneyKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

export interface SavedToast {
  message: string;
  onUndo?: () => void;
}

export interface QuickEntrySheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (toast: SavedToast) => void;
}

function Key({ value, onPress }: { value: MoneyKey; onPress: (key: MoneyKey) => void }) {
  const colors = useThemeColors();
  const label = value === 'back' ? 'Borrar' : value === ',' ? 'Coma decimal' : value;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress(value)}
      className="min-h-[48px] flex-1 items-center justify-center rounded-input active:bg-surface-2"
    >
      {value === 'back' ? (
        <Delete size={24} color={colors['text-muted']} />
      ) : (
        <Text className="font-sans-semibold text-title text-text">{value}</Text>
      )}
    </Pressable>
  );
}

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Carga rápida. Tocar una categoría guarda si ya hay monto (spec).
 * El id del movimiento se genera una vez por contenido: un reintento tras un corte de red
 * manda el mismo id y la API no duplica.
 */
export function QuickEntrySheet({ visible, onClose, onSaved }: QuickEntrySheetProps) {
  const [kind, setKind] = useState<Kind>('EXPENSE');
  const [value, setValue] = useState('0');
  const [accountIndex, setAccountIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const accounts = useAccounts();
  const categories = useCategories(kind === 'INCOME' ? 'INCOME' : 'EXPENSE');
  const save = useSaveTransaction();
  const voidTx = useVoidTransaction();
  const colors = useThemeColors();

  const account = accounts.data?.[accountIndex % Math.max(accounts.data?.length ?? 1, 1)];
  const empty = isZero(value);

  const submit = async (categoryId: string) => {
    if (!account || kind === 'TRANSFER') return;
    const amount = toMoneyString(value);
    const key = [kind, account.id, amount, categoryId, todayIso()].join('|');
    if (!attempt.current || attempt.current.key !== key) {
      attempt.current = { key, id: randomUUID() };
    }
    setError(null);
    try {
      const saved = await save.mutateAsync({
        id: attempt.current.id,
        accountId: account.id,
        type: kind,
        amount,
        categoryId,
        occurredOn: todayIso(),
      });
      attempt.current = null;
      setValue('0');
      onSaved({
        message: `${KIND_LABEL[kind]} guardado`,
        onUndo: IS_DEMO ? undefined : () => voidTx.mutate({ id: saved.id, version: saved.version }),
      });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  const shownCategories = useMemo(() => (categories.data ?? []).slice(0, 8), [categories.data]);
  const symbol = account?.currency === 'USD' ? 'US$' : '$';

  return (
    <BottomSheet visible={visible} onClose={onClose} accessibilityLabel="Nuevo movimiento">
      <View className="flex-row rounded-input bg-surface-2 p-1">
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => {
          const selected = k === kind;
          return (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setKind(k)}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-input ${selected ? 'bg-surface' : ''}`}
            >
              <Text className={`font-sans-semibold text-caption ${selected ? 'text-text' : 'text-text-muted'}`}>
                {KIND_LABEL[k]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="my-3 items-center">
        <AmountText amount={toMoneyString(value)} currency={account?.currency ?? 'UYU'} symbol={symbol} variant="display" />
      </View>

      <View className="mb-3 flex-row flex-wrap justify-center gap-2">
        <Chip
          label={account ? `Cuenta: ${account.name}` : 'Sin cuentas'}
          onPress={() => setAccountIndex((i) => i + 1)}
          disabled={!account || (accounts.data?.length ?? 0) < 2}
        />
        <Chip label={`Hoy · ${todayIso().slice(5).replace('-', '/')}`} selected />
      </View>

      {kind !== 'TRANSFER' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }} style={{ flexGrow: 0, flexShrink: 0, height: 84, marginBottom: 8 }}>
          {shownCategories.map((c) => {
            const Icon = getIcon(c.icon);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Categoría ${c.name}`}
                disabled={empty || save.isPending}
                onPress={() => submit(c.id)}
                className={`min-h-[44px] items-center justify-center gap-1 rounded-card border border-border bg-surface px-3 py-2 ${empty ? 'opacity-50' : 'active:bg-surface-2'}`}
                style={{ minWidth: 96 }}
              >
                <Icon size={18} color={colors.primary} />
                <Text className="font-sans-semibold text-caption text-text">{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text className="mb-3 text-center font-sans text-caption text-text-muted">
          Las transferencias entre cuentas llegan en el próximo entregable.
        </Text>
      )}

      <View className="mb-3 gap-1">
        {KEYS.map((row) => (
          <View key={row.join('')} className="flex-row gap-1">
            {row.map((key) => (
              <Key key={key} value={key} onPress={(k) => setValue((v) => appendKey(v, k))} />
            ))}
          </View>
        ))}
      </View>

      <Text className="text-center font-sans text-caption text-text-muted">
        {empty ? 'Ingresá un monto para guardar.' : save.isPending ? 'Guardando…' : 'Tocá una categoría para guardar.'}
      </Text>
      {IS_DEMO ? (
        <Text className="mt-2 text-center font-sans text-caption text-text-muted">
          Modo ejemplo: conectá la API para guardar movimientos.
        </Text>
      ) : null}
      {error ? <Text className="mt-2 text-center font-sans text-caption text-danger">{error}</Text> : null}
    </BottomSheet>
  );
}
