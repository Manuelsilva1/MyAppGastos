import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card } from '../src/components/ui';
import { Page } from '../src/components/layout/Page';
import { useAuthActions } from '../src/features/auth/useAuthActions';
import { useSession } from '../src/features/auth/session';
import { ApiError } from '../src/lib/api';
import { IS_DEMO } from '../src/lib/config';
import { useThemeColors } from '../src/theme';

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, 'Ingresá tu nombre').max(100),
  password: z.string().min(10, 'Mínimo 10 caracteres'),
});

type FormValues = { name?: string; email: string; password: string };

/** Ingreso y registro. Con la API sin configurar, la app abre en modo ejemplo. */
export default function LoginScreen() {
  const accessToken = useSession((s) => s.accessToken);
  const ready = useSession((s) => s.ready);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register } = useAuthActions();
  const colors = useThemeColors();
  const pending = login.isPending || register.isPending;
  const error = login.error ?? register.error;

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema) as never,
    defaultValues: { name: '', email: '', password: '' },
  });

  if (!ready) return null;
  if (accessToken) return <Redirect href="/" />;

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (mode === 'login') {
        await login.mutateAsync({ email: values.email, password: values.password });
      } else {
        await register.mutateAsync({ name: values.name ?? '', email: values.email, password: values.password });
      }
      router.replace('/');
    } catch {
      // El error se muestra desde login.error / register.error.
    }
  });

  const field = (name: keyof FormValues, label: string, secure = false, keyboard: 'default' | 'email-address' = 'default') => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View className="gap-1">
          <Text className="font-sans-semibold text-caption text-text">{label}</Text>
          <TextInput
            accessibilityLabel={label}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={secure}
            autoCapitalize="none"
            keyboardType={keyboard}
            placeholderTextColor={colors['text-muted']}
            className="min-h-[44px] rounded-input border border-border bg-surface px-3 font-sans text-body text-text"
          />
          {errors[name] ? <Text className="font-sans text-caption text-danger">{errors[name]?.message}</Text> : null}
        </View>
      )}
    />
  );

  return (
    <Page>
      <View className="mt-8 gap-2">
        <Text className="font-sans-bold text-display text-primary">Finanzas</Text>
        <Text className="font-sans text-body text-text-muted">Tus cuentas, en un solo lugar.</Text>
      </View>
      <Card className="gap-4 p-5">
        <Text className="font-sans-semibold text-heading text-text">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </Text>
        {mode === 'register' ? field('name', 'Nombre') : null}
        {field('email', 'Email', false, 'email-address')}
        {field('password', 'Contraseña', true)}
        {error instanceof ApiError ? (
          <Text className="font-sans text-caption text-danger">{error.message}</Text>
        ) : null}
        <Button label={mode === 'login' ? 'Entrar' : 'Crear cuenta'} fullWidth loading={pending} onPress={onSubmit} />
        <Button
          label={mode === 'login' ? 'No tengo cuenta: registrarme' : 'Ya tengo cuenta: entrar'}
          variant="ghost"
          fullWidth
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
        />
        {IS_DEMO ? (
          <Button label="Ver con datos de ejemplo" variant="secondary" fullWidth onPress={() => router.replace('/')} />
        ) : null}
      </Card>
    </Page>
  );
}
