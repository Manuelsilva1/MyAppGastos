import 'package:drift/drift.dart';
import 'package:gestor_de_gastos/data/local/app_database.dart';
import 'package:gestor_de_gastos/data/remote/firestore_datasource.dart';
import 'package:gestor_de_gastos/models/expense.dart';

class ExpenseRepository {
  final AppDatabase _localDb;
  final FirestoreDataSource _remoteDb;

  ExpenseRepository(this._localDb, this._remoteDb);

  // TODO: Implement event sourcing and synchronization logic

  Stream<List<Expense>> watchExpensesByAmbientId(String ambientId) {
    // For now, just watch local changes.
    // TODO: Combine with remote changes and apply event sourcing
    return _localDb.watchExpensesByAmbientId(ambientId).map((entities) => entities.map((e) => _mapExpenseEntityToModel(e)).toList());
  }

  Future<void> createExpense(Expense expense) async {
    // For now, just insert locally.
    // TODO: Record as event and sync to remote
    await _localDb.insertExpense(expenses.copyWith(
      id: Value(expense.id),
      ambientId: Value(expense.ambientId),
      description: Value(expense.description),
      amount: Value(expense.amount),
      category: Value(expense.category),
      date: Value(expense.date),
      receiptPath: Value(expense.receiptPath),
      label: Value(expense.label),
      createdAt: Value(expense.createdAt),
      updatedAt: Value(expense.updatedAt),
    ));
    // TODO: Trigger remote sync
  }

  Future<void> updateExpense(Expense expense) async {
    // For now, just update locally.
    // TODO: Record as event and sync to remote
    await _localDb.updateExpense(_mapExpenseModelToEntity(expense));
    // TODO: Trigger remote sync
  }

  Future<void> deleteExpense(String expenseId) async {
    // For now, just delete locally.
    // TODO: Record as event and sync to remote
    final expenseToDelete = await _localDb.getExpenseById(expenseId);
    if (expenseToDelete != null) {
      await _localDb.deleteExpense(expenseToDelete);
      // TODO: Trigger remote sync
    }
  }

  // Helper method to map Drift Entity to Data Model
  Expense _mapExpenseEntityToModel(ExpenseEntity entity) {
    return Expense(
      id: entity.id,
      ambientId: entity.ambientId,
      description: entity.description,
      amount: entity.amount,+
      category: entity.category,
      date: entity.date,
      receiptPath: entity.receiptPath,
      label: entity.label,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  // Helper method to map Data Model to Drift Entity
  ExpenseEntity _mapExpenseModelToEntity(Expense model) {
    return ExpenseEntity(
      id: model.id,
      ambientId: model.ambientId,
      description: model.description,
      amount: model.amount,
      category: model.category,
      date: model.date,
      receiptPath: model.receiptPath,
      label: model.label,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    );
  }
}
