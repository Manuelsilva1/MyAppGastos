import { render, screen } from '@testing-library/react-native';
import { AmountText } from '../AmountText';

describe('AmountText', () => {
  test('gasto: "− $ 450,00" con el signo menos tipográfico', async () => {
    await render(<AmountText amount="-450" currency="UYU" symbol="$" kind="expense" />);
    expect(screen.getByText('− $ 450,00')).toBeOnTheScreen();
  });

  test('ingreso: "+ $ 32.000,00"', async () => {
    await render(<AmountText amount="32000" currency="UYU" symbol="$" kind="income" />);
    expect(screen.getByText('+ $ 32.000,00')).toBeOnTheScreen();
  });

  test('transferencia: monto sin signo', async () => {
    await render(<AmountText amount="1000" currency="USD" symbol="US$" kind="transfer" />);
    expect(screen.getByText('US$ 1.000,00')).toBeOnTheScreen();
  });

  test('montos ocultos se ven como "$ •••••"', async () => {
    await render(<AmountText amount="-450" currency="UYU" symbol="$" kind="expense" hidden />);
    expect(screen.getByText('$ •••••')).toBeOnTheScreen();
    expect(screen.queryByText(/450/)).toBeNull();
  });

  test('el texto accesible incluye la moneda y el monto formateado', async () => {
    await render(<AmountText amount="120" currency="USD" symbol="US$" />);
    expect(screen.getByLabelText('USD US$ 120,00')).toBeOnTheScreen();
  });
});
