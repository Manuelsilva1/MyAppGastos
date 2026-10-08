import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Delete } from 'lucide-react-native';
import { AmountText, BottomSheet, Button } from '../ui';
import { appendKey, isZero, type MoneyKey } from '../../features/quick-entry/amountInput';

type Kind = 'EXPENSE' | 'INCOME' | 'TRANSFER';

const KIND_LABEL: Record<Kind, string> = { EXPENSE: 'Gasto', INCOME: 'Ingreso', TRANSFER: 'Transferencia' };

const KEYS: MoneyKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

export interface QuickEntrySheetProps {
  visible: boolean;
  onClose: () => void;
}

function Key({ value, onPress }: { value: MoneyKey; onPress: (key: MoneyKey) => void }) {
  const label = value === 'back' ? 'Borrar' : value === ',' ? 'Coma decimal' : value;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress(value)}
      className="min-h-[56px] flex-1 items-center justify-center rounded-input active:bg-surface-2"
    >
      {value === 'back' ? <Delete size={24} color="#6B6F68" /> : <Text className="font-sans-semibold text-title text-text">{value === ',' ? ',' : value}</Text>}
    </Pressable>
  );
}

/**
 * Carga rápida: segmentado Gasto | Ingreso | Transferencia, monto grande y teclado propio.
 * El guardado llega con la API (próximo entregable); por ahora el botón queda deshabilitado.
 */
export function QuickEntrySheet({ visible, onClose }: QuickEntrySheetProps) {
  const [kind, setKind] = useState<Kind>('EXPENSE');
  const [value, setValue] = useState('0');
  const empty = isZero(value);

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

      <View className="my-6 items-center">
        <AmountText amount={value.replace(',', '.')} currency="UYU" symbol="$" variant="display" kind="neutral" />
      </View>

      <View className="mb-4 flex-row flex-wrap justify-center gap-2">
        <Text className="rounded-full border border-border px-3 py-1 font-sans text-caption text-text-muted">Cuenta: elegir</Text>
        <Text className="rounded-full border border-border px-3 py-1 font-sans text-caption text-text-muted">Hoy</Text>
        <Text className="rounded-full border border-border px-3 py-1 font-sans text-caption text-text-muted">Nota</Text>
      </View>

      <View className="mb-4 gap-1">
        {KEYS.map((row) => (
          <View key={row.join('')} className="flex-row gap-1">
            {row.map((key) => (
              <Key key={key} value={key} onPress={(k) => setValue((v) => appendKey(v, k))} />
            ))}
          </View>
        ))}
      </View>

      <Button label="Guardar" fullWidth disabled={empty} onPress={() => undefined} />
      <Text className="mt-2 text-center font-sans text-caption text-text-muted">
        El guardado se conecta con la API en el próximo entregable.
      </Text>
    </BottomSheet>
  );
}
