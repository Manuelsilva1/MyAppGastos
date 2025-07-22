import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:gestor_de_gastos/presentation/state/expense_state.dart';
import 'package:gestor_de_gastos/presentation/state/expense_filter_state.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:collection/collection.dart';
import 'dart:math';
// TODO: Import csv and pdf packages

class AmbientDashboardScreen extends ConsumerWidget {
  final String ambientId;

  const AmbientDashboardScreen({super.key, required this.ambientId});

  void _exportToCsv(BuildContext context, List expenses) {
    // TODO: Implement CSV export logic
    print('Exporting to CSV for ambient: $ambientId');
     // Example: Generate CSV data
    /*
    List<List<dynamic>> rows = [];
    rows.add(['ID', 'Description', 'Amount', 'Category', 'Date', 'Receipt Path', 'Label']); // Header
    for (var expense in expenses) {
      rows.add([
        expense.id,
        expense.description,
        expense.amount,
        expense.category,
        DateTime.fromMillisecondsSinceEpoch(expense.date).toIso8601String(),
        expense.receiptPath ?? '',
        expense.label ?? '',
      ]);
    }
    String csvData = const ListToCsvConverter().convert(rows);
    // TODO: Save or share the CSV file
    */
  }

  void _exportToPdf(BuildContext context, List expenses) {
    // TODO: Implement PDF export logic with receipts
    print('Exporting to PDF for ambient: $ambientId');
    // TODO: Generate PDF and share/save
  }

  void _importFromCsv(BuildContext context) {
    // TODO: Implement CSV import logic
    print('Importing from CSV for ambient: $ambientId');
    // TODO: Pick CSV file and parse
    // TODO: Add imported expenses to the database
  }


  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expenseState = ref.watch(expenseProvider(ambientId));
    final filteredExpenses = ref.watch(filteredExpensesProvider(ambientId));
    final localizations = AppLocalizations.of(context)!;
    final filterNotifier = ref.read(expenseFilterProvider.notifier);

    // TODO: Fetch ambient name using ambientId to display in title

    // Aggregate filtered expenses by category
    final Map<String, double> categoryTotals =
        groupBy(filteredExpenses, (expense) => expense.category)
            .map((category, expenses) => MapEntry(
                category,
                expenses.fold(0.0, (sum, expense) => sum + expense.amount)));

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.ambientDashboardTitle.replaceFirst('{ambientName}', ambientId)),
        actions: [
          // Filter by Date Range
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () async {
              final picked = await showDateRangePicker(
                context: context,
                firstDate: DateTime(2000),
                lastDate: DateTime.now(),
                initialDateRange: DateTimeRange(
                  start: ref.read(expenseFilterProvider).startDate ?? DateTime.now().subtract(const Duration(days: 30)),
                  end: ref.read(expenseFilterProvider).endDate ?? DateTime.now(),
                ),
              );
              if (picked != null) {
                filterNotifier.setDateRange(picked.start, picked.end);
              } else {
                filterNotifier.setDateRange(null, null);
              }
            },
            tooltip: localizations.filterByDateTooltip, // TODO: Add to l10n
          ),
          // Search
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: ExpenseSearchDelegate(ambientId: ambientId, ref: ref), // TODO: Create ExpenseSearchDelegate
              );
            },
            tooltip: localizations.searchExpensesTooltip, // TODO: Add to l10n
          ),
          // More options menu
          PopupMenuButton<String>(
            onSelected: (String item) {
              switch (item) {
                case 'export_csv':
                  _exportToCsv(context, filteredExpenses); // Pass filtered expenses
                  break;
                case 'export_pdf':
                  _exportToPdf(context, filteredExpenses); // Pass filtered expenses
                  break;
                case 'import_csv':
                   _importFromCsv(context);
                  break;
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              PopupMenuItem<String>(
                value: 'export_csv',
                child: Text(localizations.exportCsvOption), // TODO: Localize
              ),
              PopupMenuItem<String>(
                value: 'export_pdf',
                child: Text(localizations.exportPdfOption), // TODO: Localize
              ),
               PopupMenuItem<String>(
                value: 'import_csv',
                child: Text(localizations.importCsvOption), // TODO: Localize
              ),
            ],
          ),+
        ],
      ),
      body: expenseState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : expenseState.error != null
              ? Center(child: Text('${localizations.error}: ${expenseState.error}'))
              : Column(
                  children: [
                    // Graphical Summary
                    AspectRatio(
                      aspectRatio: 1.7,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: categoryTotals.isEmpty
                            ? Center(child: Text(localizations.noExpensesMessage))
                            : PieChart(
                                PieChartData(
                                  sections: _buildChartSections(categoryTotals),
                                  borderData: FlBorderData(show: false),
                                  sectionsSpace: 2,
                                  centerSpaceRadius: 40,
                                ),
                              ),
                      ),
                    ),
                     const SizedBox(height: 16),
                    Expanded(
                      child: filteredExpenses.isEmpty
                          ? Center(child: Text(localizations.noExpensesMessage))
                          : ListView.builder(
                              itemCount: filteredExpenses.length,
                              itemBuilder: (context, index) {
                                final expense = filteredExpenses[index];
                                return ListTile(
                                  title: Text(expense.description),
                                  subtitle: Text('${expense.amount.toStringAsFixed(2)} ${expense.category}'),
                                  trailing: Text(DateTime.fromMillisecondsSinceEpoch(expense.date).toLocal().toString().split(' ')[0]),
                                  onTap: () {
                                    context.go('/ambient/$ambientId/${expense.id}');
                                  },
                                );
                              },
                            ),
                    ),
                  ],
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.go('/ambient/$ambientId/new');
        },
        tooltip: localizations.addExpenseButtonTooltip,
        child: const Icon(Icons.add),
      ),
    );
  }

  List<PieChartSectionData> _buildChartSections(Map<String, double> categoryTotals) {
    final List<Color> colors = _generateColors(categoryTotals.length);

    return categoryTotals.entries.toList().asMap().entries.map((entry) {
      final index = entry.key;
      final categoryEntry = entry.value;
      final category = categoryEntry.key;
      final totalAmount = categoryEntry.value;

      return PieChartSectionData(
        value: totalAmount,
        title: category,
        color: colors[index],
        radius: 50,
        titleStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
      );
    }).toList();
  }

  List<Color> _generateColors(int count) {
    final Random random = Random();
    final Set<Color> generatedColors = {};
    while (generatedColors.length < count) {
      generatedColors.add(Color(random.nextInt(0xffffffff)).withOpacity(1.0));
    }
    return generatedColors.toList();
  }
}
