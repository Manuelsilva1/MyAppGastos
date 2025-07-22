import 'package:drift/drift.dart';
import 'package:gestor_de_gastos/data/local/app_database.dart';
import 'package:gestor_de_gastos/data/remote/firestore_datasource.dart';
import 'package:gestor_de_gastos/models/ambient.dart';

class AmbientRepository {
  final AppDatabase _localDb;
  final FirestoreDataSource _remoteDb;

  AmbientRepository(this._localDb, this._remoteDb);

  // TODO: Implement event sourcing and synchronization logic

  Stream<List<Ambient>> watchAllAmbients() {
    // For now, just watch local changes.
    // TODO: Combine with remote changes and apply event sourcing
    return _localDb.watchAllAmbients().map((entities) => entities.map((e) => _mapAmbientEntityToModel(e)).toList());
  }

  Future<void> createAmbient(Ambient ambient) async {
    // For now, just insert locally.
    // TODO: Record as event and sync to remote
    await _localDb.insertAmbient(ambients.copyWith(
      id: Value(ambient.id),
      name: Value(ambient.name),
      color: Value(ambient.color),
      currencyCode: Value(ambient.currencyCode),
      createdAt: Value(ambient.createdAt),
      updatedAt: Value(ambient.updatedAt),
    ));
    // TODO: Trigger remote sync
  }

  Future<void> updateAmbient(Ambient ambient) async {
    // For now, just update locally.
    // TODO: Record as event and sync to remote
    await _localDb.updateAmbient(_mapAmbientModelToEntity(ambient));
    // TODO: Trigger remote sync
  }

  Future<void> deleteAmbient(String ambientId) async {
    // For now, just delete locally.
    // TODO: Record as event and sync to remote
    final ambientToDelete = await _localDb.getAmbientById(ambientId);
    if (ambientToDelete != null) {
      await _localDb.deleteAmbient(ambientToDelete);
      // TODO: Trigger remote sync
    }
  }

  // Helper method to map Drift Entity to Data Model
  Ambient _mapAmbientEntityToModel(AmbientEntity entity) {
    return Ambient(
      id: entity.id,
      name: entity.name,
      color: entity.color,
      currencyCode: entity.currencyCode,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  // Helper method to map Data Model to Drift Entity
  AmbientEntity _mapAmbientModelToEntity(Ambient model) {
    return AmbientEntity(
      id: model.id,
      name: model.name,
      color: model.color,
      currencyCode: model.currencyCode,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    );
  }
}
