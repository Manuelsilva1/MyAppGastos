import 'package:get_it/get_it.dart';
import 'package:gestor_de_gastos/data/local/app_database.dart';
import 'package:gestor_de_gastos/data/remote/firestore_datasource.dart';
import 'package:gestor_de_gastos/repositories/ambient_repository.dart';
import 'package:gestor_de_gastos/repositories/expense_repository.dart';

final GetIt getIt = GetIt.instance;

void setupLocator() {
  // Register Local Database
  getIt.registerSingleton<AppDatabase>(AppDatabase());

  // Register Remote Data Source
  getIt.registerSingleton<FirestoreDataSource>(FirestoreDataSource());

  // Register Repositories
  getIt.registerSingleton<AmbientRepository>(
    AmbientRepository(getIt<AppDatabase>(), getIt<FirestoreDataSource>()),
  );
  getIt.registerSingleton<ExpenseRepository>( // Register ExpenseRepository
    ExpenseRepository(getIt<AppDatabase>(), getIt<FirestoreDataSource>()),
  );

  // TODO: Register State Notifiers and other services
}
