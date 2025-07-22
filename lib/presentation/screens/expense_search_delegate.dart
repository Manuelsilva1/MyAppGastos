import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:gestor_de_gastos/models/expense.dart';
import 'package:gestor_de_gastos/presentation/state/expense_state.dart';
import 'package:gestor_de_gastos/presentation/state/expense_filter_state.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class ExpenseSearchDelegate extends SearchDelegate<Expense?> {
  final String ambientId;
  final WidgetRef ref;

  ExpenseSearchDelegate({required this.ambientId, required this.ref});

  @override
  String get searchFieldLabel => AppLocalizations.of(ref.context)!.searchExpensesTooltip;

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () {
          query = '';
          showSuggestions(context);
        },
      ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, null);
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    ref.read(expenseFilterProvider.notifier).setSearchQuery(query);
    final filteredExpenses = ref.watch(filteredExpensesProvider(ambientId));
    final localizations = AppLocalizations.of(context)!;

    if (filteredExpenses.isEmpty) {
      return Center(child: Text(localizations.noExpensesFoundMessage)); // Use localized message
    }

    return ListView.builder(
      itemCount: filteredExpenses.length,
      itemBuilder: (context, index) {
        final expense = filteredExpenses[index];
        return ListTile(
          title: Text(expense.description),
          subtitle: Text('${expense.amount.toStringAsFixed(2)} ${expense.category}'), // TODO: Format currency
          trailing: Text(DateTime.fromMillisecondsSinceEpoch(expense.date).toLocal().toString().split(' ')[0]), // TODO: Format date
           onTap: () {
             close(context, expense);
              context.go('/ambient/$ambientId/${expense.id}');
           },
        );
      },
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    final expenses = ref.watch(expenseProvider(ambientId)).expenses;
    final suggestions = expenses.where((expense) {
      final queryLower = query.toLowerCase();
      return expense.description.toLowerCase().contains(queryLower) ||
          expense.category.toLowerCase().contains(queryLower) ||
          (expense.label != null && expense.label!.toLowerCase().contains(queryLower));
    }).toList();
    final localizations = AppLocalizations.of(context)!;

     if (query.isEmpty) {
       return Center(child: Text(localizations.enterSearchQueryMessage)); // Use localized message
     }


    if (suggestions.isEmpty) {
      return Center(child: Text(localizations.noSuggestionsMessage)); // Use localized message
    }


    return ListView.builder(
      itemCount: suggestions.length,
      itemBuilder: (context, index) {
        final expense = suggestions[index];
        return ListTile(
          title: Text(expense.description),
          subtitle: Text('${expense.amount.toStringAsFixed(2)} ${expense.category}'), // TODO: Format currency
           onTap: () {
             query = expense.description;
             showResults(context);
           },
        );
      },
    );
  }
}
