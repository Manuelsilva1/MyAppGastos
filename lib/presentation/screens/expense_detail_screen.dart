import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:gestor_de_gastos/presentation/state/expense_state.dart';
import 'package:gestor_de_gastos/models/expense.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:intl/intl.dart'; // Import for date formatting

class ExpenseDetailScreen extends ConsumerWidget {
  final String ambientId;
  final String expenseId;

  const ExpenseDetailScreen({super.key, required this.ambientId, required this.expenseId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expenseState = ref.watch(expenseProvider(ambientId));
    final localizations = AppLocalizations.of(context)!;

    // Find the expense with the given ID
    final expense = expenseState.expenses.firstWhere(
      (expense) => expense.id == expenseId,
      orElse: () => Expense( // Placeholder if not found
        id: expenseId,
        ambientId: ambientId,
        description: localizations.errorExpenseNotFound,
        amount: 0.0,
        category: '',
        date: 0,
        createdAt: 0,
        updatedAt: 0,
      ),
    );

    void deleteExpenseWithUndo() {
      final expenseNotifier = ref.read(expenseProvider(ambientId).notifier);
      expenseNotifier.deleteExpense(expenseId);

      // Show SnackBar with undo option
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(localizations.expenseDeletedMessage), // TODO: Localize
          action: SnackBarAction(
            label: localizations.undoButtonText, // TODO: Localize
            onPressed: () {
              // TODO: Implement undo functionality (re-create the expense)
              // This will require storing the deleted expense temporarily
            },
          ),
          duration: const Duration(seconds: 5), // Adjust duration as needed
        ),
      );
      context.pop(); // Go back after deleting
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.expenseDetailTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // Navigate to edit expense form, passing the expense object
              context.go('/ambient/$ambientId/new', extra: expense);
            },
            tooltip: localizations.editExpenseTooltip,
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: deleteExpenseWithUndo, // Call the delete function with undo
            tooltip: localizations.deleteExpenseTooltip,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView( // Use ListView for scrolling
          children: [
            Text('${localizations.expenseDescriptionLabel}: ${expense.description}', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 10),
            Text('${localizations.expenseAmountLabel}: ${expense.amount.toStringAsFixed(2)}', style: Theme.of(context).textTheme.titleMedium), // TODO: Format currency
            const SizedBox(height: 10),
            Text('${localizations.expenseCategoryLabel}: ${expense.category}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 10),
            Text('${localizations.expenseDateLabel}: ${DateFormat.yMd().format(DateTime.fromMillisecondsSinceEpoch(expense.date))}', style: Theme.of(context).textTheme.titleMedium), // TODO: Use ambient locale
            const SizedBox(height: 10),
            if (expense.label != null)
              Text('${localizations.expenseLabelLabel}: ${expense.label!}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            // Display receipt image with Hero animation
            if (expense.receiptPath != null && File(expense.receiptPath!).existsSync())
              Hero(
                 tag: 'receipt-image-${expense.id}', // Unique tag for Hero animation
                 child: Image.file(
                   File(expense.receiptPath!),
                   height: 200, // Adjust height as needed
                    fit: BoxFit.cover,
                 ),
               ),
          ],
        ),
      ),
    );
  }
}
