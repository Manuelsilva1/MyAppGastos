import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:gestor_de_gastos/models/ambient.dart';
import 'package:gestor_de_gastos/models/expense.dart';

class FirestoreDataSource {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;
  bool get isAuthenticated => currentUser != null;

  // Helper to get user-specific collection path
  String _getUserCollectionPath(String collection) {
    if (!isAuthenticated) {
      throw StateError('User not authenticated.');
    }
    return 'users/${currentUser!.uid}/$collection';
  }

  // Ambient Operations
  Future<void> createAmbient(Ambient ambient) async {
    if (!isAuthenticated) return; // Do nothing if not authenticated
    final collectionRef = _firestore.collection(_getUserCollectionPath('ambients'));
    await collectionRef.doc(ambient.id).set(ambient.toJson());
  }

  Stream<List<Ambient>> watchAmbients() {
    if (!isAuthenticated) return Stream.value([]); // Return empty stream if not authenticated
    final collectionRef = _firestore.collection(_getUserCollectionPath('ambients'));
    return collectionRef.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Ambient.fromJson(doc.data())).toList();
    });
  }

  Future<void> updateAmbient(Ambient ambient) async {
    if (!isAuthenticated) return;
    final docRef = _firestore.collection(_getUserCollectionPath('ambients')).doc(ambient.id);
    await docRef.update(ambient.toJson());
  }

  Future<void> deleteAmbient(String ambientId) async {
    if (!isAuthenticated) return;
    final docRef = _firestore.collection(_getUserCollectionPath('ambients')).doc(ambientId);
    await docRef.delete();
  }

  // Expense Operations
  Future<void> createExpense(Expense expense) async {
    if (!isAuthenticated) return;
    final collectionRef = _firestore.collection(_getUserCollectionPath('expenses'));
    await collectionRef.doc(expense.id).set(expense.toJson());
  }

  Stream<List<Expense>> watchExpenses(String ambientId) {
    if (!isAuthenticated) return Stream.value([]);
    final collectionRef = _firestore.collection(_getUserCollectionPath('expenses'));
    return collectionRef
        .where('ambientId', isEqualTo: ambientId)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => Expense.fromJson(doc.data())).toList();
    });
  }

  Future<void> updateExpense(Expense expense) async {
    if (!isAuthenticated) return;
    final docRef = _firestore.collection(_getUserCollectionPath('expenses')).doc(expense.id);
    await docRef.update(expense.toJson());
  }

  Future<void> deleteExpense(String expenseId) async {
    if (!isAuthenticated) return;
    final docRef = _firestore.collection(_getUserCollectionPath('expenses')).doc(expenseId);
    await docRef.delete();
  }

  // TODO: Implement anonymous authentication and sign out
  Future<UserCredential> signInAnonymously() async {
    return await _auth.signInAnonymously();
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
