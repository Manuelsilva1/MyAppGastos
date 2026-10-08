import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Button, Snackbar } from '../index';
import { getIcon } from '../icon';
import { Tag, ShoppingCart } from 'lucide-react-native';

describe('Button', () => {
  test('dispara onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Guardar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('deshabilitado no dispara onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Guardar" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Snackbar', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('se cierra solo a los 5 segundos', async () => {
    const onDismiss = jest.fn();
    await render(<Snackbar message="Gasto guardado" onDismiss={onDismiss} />);
    await act(async () => {
      jest.advanceTimersByTime(4999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('la acción "Deshacer" ejecuta onAction y cierra', async () => {
    const onAction = jest.fn();
    const onDismiss = jest.fn();
    await render(
      <Snackbar message="Gasto guardado" actionLabel="Deshacer" onAction={onAction} onDismiss={onDismiss} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Deshacer' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('getIcon', () => {
  test('convierte el nombre guardado en kebab-case al ícono de lucide', () => {
    expect(getIcon('shopping-cart')).toBe(ShoppingCart);
  });

  test('ícono desconocido o vacío cae en Tag', () => {
    expect(getIcon('no-existe')).toBe(Tag);
    expect(getIcon(null)).toBe(Tag);
  });
});
