import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:gestor_de_gastos/models/expense.dart';
import 'package:gestor_de_gastos/presentation/state/expense_state.dart'; // Import expenseProvider

// Define the state for the ExpenseFilterNotifier
class ExpenseFilterState {
  final DateTime? startDate;
  final DateTime? endDate;
  final String searchQuery;

  ExpenseFilterState({
    this.startDate,
    this.endDate,
    this.searchQuery = '',
  });

  ExpenseFilterState copyWith({
    DateTime? startDate,
    DateTime? endDate,
    String? searchQuery,
  }) {
    return ExpenseFilterState(
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

// Define the StateNotifier for filtering
class ExpenseFilterNotifier extends StateNotifier<ExpenseFilterState> {
  ExpenseFilterNotifier() : super(ExpenseFilterState());

  void setDateRange(DateTime? startDate, DateTime? endDate) {
    state = state.copyWith(startDate: startDate, endDate: endDate);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }
}

// Define the Riverpod provider for the filter state
final expenseFilterProvider = StateNotifierProvider<ExpenseFilterNotifier, ExpenseFilterState>(
  (ref) => ExpenseFilterNotifier(),
);

// Define a provider that filters the expenses based on the filter state
final filteredExpensesProvider = Provider.family<List<Expense>, String>((ref, ambientId) {
  final expenses = ref.watch(expenseProvider(ambientId)).expenses;
  final filter = ref.watch(expenseFilterProvider);

  // Apply filters
  return expenses.where((expense) {
    bool dateMatch = true;
    if (filter.startDate != null) {
      dateMatch = DateTime.fromMillisecondsSinceEpoch(expense.date).isAfter(filter.startDate!) ||
          DateTime.fromMillisecondsSinceEpoch(expense.date).isAtSameYearAs(filter.startDate!) &&
          DateTime.fromMillisecondsSinceEpoch(expense.date).isAtSameMonthAs(filter.startDate!) &&
          DateTime.fromMillisecondsSinceEpoch(expense.date).isAtSameDayAs(filter.startDate!);
    }
    if (filter.endDate != null) {
      dateMatch = dateMatch &&
          (DateTime.fromMillisecondsSinceEpoch(expense.date).isBefore(filter.endDate!) ||
              DateTime.fromMillisecondsSinceEpoch(expense.date).isAtSameYearAs(filter.endDate!) &&
              DateTime.fromMillisecondsSinceEpoch(expense.date).isAtSameMonthAs(filter.endDate!) &&
              DateTime.fromMillisecondsSinceEpoch(expense.date).isAtSameDayAs(filter.endDate!));
    }

    bool searchMatch = filter.searchQuery.isEmpty ||
        expense.description.toLowerCase().contains(filter.searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().contains(filter.searchQuery.toLowerCase()) ||
        (expense.label != null && expense.label!.toLowerCase().contains(filter.searchQuery.toLowerCase()));

    return dateMatch && searchMatch;
  }).toList();
});
