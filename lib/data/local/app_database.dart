import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:sqlite3/sqlite3.dart';
import 'package:sqlite3_flutter_libs/sqlite3_flutter_libs.dart';
import 'package:sqlcipher_flutter_libs/sqlcipher_flutter_libs.dart';
import 'package:uuid/uuid.dart';
import 'package:gestor_de_gastos/models/ambient.dart'; // Import models for event data
import 'package:gestor_de_gastos/models/expense.dart'; // Import models for event data


// Import the generated file
part 'app_database.g.dart';

const uuid = Uuid();

// Define possible event types
enum EventType {
  ambientCreated,
  ambientUpdated,
  ambientDeleted,
  expenseCreated,
  expenseUpdated,
  expenseDeleted,
}

// Table to store events
class Events extends Table {
  TextColumn get id => text().clientDefault(() => uuid.v4())(); // Event ID
  TextColumn get aggregateId => text()(); // ID of the aggregate (Ambient or Expense)
  TextColumn get aggregateType => text()(); // Type of the aggregate ('Ambient' or 'Expense')
  IntColumn get timestamp => integer()(); // Event timestamp
  TextColumn get type => textEnum<EventType>()(); // Event type
  TextColumn get data => text()(); // Event data (JSON string of the model)
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))(); // Sync status

  @override
  Set<Column> get primaryKey => {id};
}


@DataClassName('AmbientEntity')
class Ambients extends Table {
  TextColumn get id => text().clientDefault(() => uuid.v4())(); // Using uuid for IDs
  TextColumn get name => text().withCollation(affinityCaseInsensitive).withLength(min: 1, max: 100)();
  IntColumn get color => integer()(); // Store color as integer value
  TextColumn get currencyCode => text().withLength(min: 3, max: 3)();
  IntColumn get createdAt => integer()();
  IntColumn get updatedAt => integer()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('ExpenseEntity')
class Expenses extends Table {
  TextColumn get id => text().clientDefault(() => uuid.v4())(); // Using uuid for IDs
  TextColumn get ambientId => text().references(Ambients, #id, onDelete: KeyAction.cascade)();
  TextColumn get description => text().withCollation(affinityCaseInsensitive).withLength(min: 1, max: 255)();
  RealColumn get amount => real()();
  TextColumn get category => text().withCollation(affinityCaseInsensitive).withLength(min: 1, max: 100)();
  IntColumn get date => integer()(); // Store date as Unix timestamp
  TextColumn get receiptPath => text().nullable()();
  TextColumn get label => text().nullable().withCollation(affinityCaseInsensitive).withLength(min: 1, max: 50)();
  IntColumn get createdAt => integer()();
  IntColumn get updatedAt => integer()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [Ambients, Expenses, Events]) // Add Events table
class AppDatabase extends _$AppDatabase {
  // we tell the database where to store the data
  AppDatabase() : super(_openConnection());

  // you should bump this number whenever you change or add a table..s
  @override
  int get schemaVersion => 2; // Increment schema version

  // TODO: Implement migrations

  // Event methods
  Future<void> saveEvent(EventsCompanion event) => into(events).insert(event);
  Future<List<Event>> getUnsyncedEvents() => (select(events)..where((tbl) => tbl.isSynced.equals(false))).get();
  Future<void> markEventAsSynced(String eventId) => (update(events)..where((tbl) => tbl.id.equals(eventId))).write(const EventsCompanion(isSynced: Value(true)));


  // Basic CRUD for entities (will be used internally by event application logic)
  Future<void> insertAmbientEntity(AmbientEntity ambient) => into(ambients).insert(ambient);
  Future<void> updateAmbientEntity(AmbientEntity ambient) => update(ambients).replace(ambient);
  Future<void> deleteAmbientEntity(String ambientId) => (delete(ambients)..where((tbl) => tbl.id.equals(ambientId))).go();

   Future<void> insertExpenseEntity(ExpenseEntity expense) => into(expenses).insert(expense);
  Future<void> updateExpenseEntity(ExpenseEntity expense) => update(expenses).replace(expense);
  Future<void> deleteExpenseEntity(String expenseId) => (delete(expenses)..where((tbl) => tbl.id.equals(expenseId))).go();


  // Example queries (will be used by repositories, will need to consider events later)
  Stream<List<AmbientEntity>> watchAllAmbients() => select(ambients).watch();
  Future<AmbientEntity?> getAmbientById(String id) => (select(ambients)..where((tbl) => tbl.id.equals(id))).getSingleOrNull();

  Stream<List<ExpenseEntity>> watchExpensesByAmbientId(String ambientId) =>
      (select(expenses)..where((tbl) => tbl.ambientId.equals(ambientId))).watch();
  Future<ExpenseEntity?> getExpenseById(String id) => (select(expenses)..where((tbl) => tbl.id.equals(id))).getSingleOrNull();

  // Query for ambient summary
   Stream<double?> getTotalExpensesByAmbientId(String ambientId) {
    final total = expenses.amount.sum();
    return (selectOnly(expenses)..where((tbl) => tbl.ambientId.equals(ambientId)))
        .addColumns([total])
        .watchSingleOrNull()
        .map((row) => row.read(total));
  }

   Stream<DateTime?> getLastExpenseDateByAmbientId(String ambientId) {
    final lastDate = expenses.date.max();
     return (selectOnly(expenses)..where((tbl) => tbl.ambientId.equals(ambientId)))
         .addColumns([lastDate])
         .watchSingleOrNull()
         .map((row) => row.read(lastDate) != null ? DateTime.fromMillisecondsSinceEpoch(row.read(lastDate)!) : null);
   }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    // Important: load sqlcipher library
    await applySqlCipher();

    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'gestor_de_gastos.sqlite'));

    // TODO: Securely manage and retrieve encryption key
    final password = 'your-encryption-key'; // REPLACE WITH SECURE KEY MANAGEMENT

    return NativeDatabase.createInBackground(file,
        setup: (db) {
          db.execute('PRAGMA key = '$password';');
        },
        sqlite3: sqlite3.open);
  });
}
