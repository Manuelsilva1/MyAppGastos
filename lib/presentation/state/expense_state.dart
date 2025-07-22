import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import 'package:gestor_de_gastos/models/expense.dart';
import 'package:gestor_de_gastos/repositories/expense_repository.dart';
import 'package:gestor_de_gastos/utils/service_locator.dart';

// Define the state for the ExpenseNotifier
class ExpenseState {
  final List<Expense> expenses;
  final bool isLoading;
  final String? error;

  ExpenseState({
    required this.expenses,
    this.isLoading = false,
    this.error,
  });

  ExpenseState copyWith({
    List<Expense>? expenses,
    bool? isLoading,
    String? error,
  }) {
    return ExpenseState(
      expenses: expenses ?? this.expenses,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Define the StateNotifier
class ExpenseNotifier extends StateNotifier<ExpenseState> {
  final ExpenseRepository _expenseRepository;
  final String _ambientId;

  ExpenseNotifier(this._expenseRepository, this._ambientId) : super(ExpenseState(expenses: [])) {
    _loadExpenses();
  }

  Future<void> _loadExpenses() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // The repository will provide a stream of expenses for the given ambient
      _expenseRepository.watchExpensesByAmbientId(_ambientId).listen(
        (expenses) {
          state = state.copyWith(expenses: expenses, isLoading: false);
        },
        onError: (e) {
          state = state.copyWith(isLoading: false, error: 'Error loading expenses: $e');
        },
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error loading expenses: $e');
    }
  }

  Future<void> createExpense(Expense expense) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _expenseRepository.createExpense(expense);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error creating expense: $e');
    }
  }

  Future<void> updateExpense(Expense expense) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _expenseRepository.updateExpense(expense);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error updating expense: $e');
    }
  }

  Future<void> deleteExpense(String expenseId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _expenseRepository.deleteExpense(expenseId);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error deleting expense: $e');
    }
  }
}

// Define the Riverpod provider that depends on ambientId
final expenseProvider = StateNotifierProvider.family<ExpenseNotifier, ExpenseState, String>(
  (ref, ambientId) => ExpenseNotifier(getIt<ExpenseRepository>(), ambientId),
);
