import { z } from 'zod';
import { isMoney, toUnits } from '../money';

// Esquemas compartidos entre la app y la API. Reflejan las reglas del backend (Bean Validation y la base).

const RATE_RE = /^\d{1,11}(\.\d{1,8})?$/;

export const uuidSchema = z.uuid({ message: 'Identificador inválido' });

export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Código de moneda ISO 4217 de 3 letras');

export const isoDateSchema = z.iso.date({ message: 'Fecha inválida (AAAA-MM-DD)' });

/** Monto como string: hasta 15 dígitos enteros y 4 decimales. Puede ser negativo. */
export const moneySchema = z
  .string()
  .refine(isMoney, 'Monto inválido: hasta 15 dígitos y 4 decimales');

/** Monto como string mayor que cero. */
export const positiveMoneySchema = moneySchema.refine(
  (value) => isMoney(value) && !value.startsWith('-') && toUnits(value) > 0n,
  'El monto debe ser mayor que cero',
);

/** Tipo de cambio: hasta 8 decimales, mayor que cero. */
export const exchangeRateSchema = z
  .string()
  .regex(RATE_RE, 'Tipo de cambio inválido: hasta 8 decimales')
  .refine((value) => /[1-9]/.test(value), 'El tipo de cambio debe ser mayor que cero');

export const transactionCreateSchema = z
  .object({
    id: uuidSchema,
    accountId: uuidSchema,
    type: z.enum(['EXPENSE', 'INCOME', 'ADJUSTMENT']),
    /** Positivo en EXPENSE e INCOME; con signo y distinto de cero en ADJUSTMENT. */
    amount: moneySchema,
    categoryId: uuidSchema.optional(),
    description: z.string().max(200).optional(),
    note: z.string().max(2000).optional(),
    occurredOn: isoDateSchema,
    tagIds: z.array(uuidSchema).max(10).default([]),
  })
  .superRefine((tx, ctx) => {
    // Si el monto ya es inválido, el error de formato lo reporta moneySchema; acá no se opera.
    if (!isMoney(tx.amount)) return;
    if (tx.type === 'ADJUSTMENT') {
      if (toUnits(tx.amount) === 0n) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'El ajuste no puede ser cero' });
      }
      if (tx.categoryId !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Los ajustes no llevan categoría' });
      }
      return;
    }
    if (!/^\d/.test(tx.amount) || toUnits(tx.amount) === 0n) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Para gastos e ingresos el monto es positivo y mayor que cero',
      });
    }
    if (tx.categoryId === undefined) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'La categoría es obligatoria' });
    }
  });

export type TransactionCreate = z.infer<typeof transactionCreateSchema>;

/**
 * Transferencia entre cuentas propias.
 * `sameCurrency` lo calcula el cliente con las monedas de las dos cuentas,
 * y determina si el tipo de cambio es obligatorio o está prohibido.
 */
export function transferCreateSchema(options: { sameCurrency: boolean }) {
  return z
    .object({
      id: uuidSchema,
      fromAccountId: uuidSchema,
      toAccountId: uuidSchema,
      fromAmount: positiveMoneySchema,
      toAmount: positiveMoneySchema,
      exchangeRate: exchangeRateSchema.optional(),
      occurredOn: isoDateSchema,
      description: z.string().max(200).optional(),
    })
    .superRefine((t, ctx) => {
      if (t.fromAccountId === t.toAccountId) {
        ctx.addIssue({ code: 'custom', path: ['toAccountId'], message: 'Elegí una cuenta distinta a la de origen' });
      }
      if (options.sameCurrency) {
        if (t.exchangeRate !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'Entre cuentas de la misma moneda no se usa tipo de cambio',
          });
        }
        if (isMoney(t.fromAmount) && isMoney(t.toAmount) && toUnits(t.fromAmount) !== toUnits(t.toAmount)) {
          ctx.addIssue({
            code: 'custom',
            path: ['toAmount'],
            message: 'En la misma moneda, el monto de destino es igual al de origen',
          });
        }
      } else if (t.exchangeRate === undefined) {
        ctx.addIssue({ code: 'custom', path: ['exchangeRate'], message: 'Falta el tipo de cambio' });
      }
    });
}

export type TransferCreate = z.infer<ReturnType<typeof transferCreateSchema>>;
