import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import 'package:gestor_de_gastos/models/ambient.dart';
import 'package:gestor_de_gastos/repositories/ambient_repository.dart';
import 'package:gestor_de_gastos/repositories/expense_repository.dart'; // Import ExpenseRepository
import 'package:gestor_de_gastos/utils/service_locator.dart';
import 'package:collection/collection.dart'; // Import for groupBy

// Define the state for the AmbientNotifier
class AmbientState {
  final List<Ambient> ambients;
  final Map<String, AmbientSummary> ambientSummaries; // Add ambient summaries
  final bool isLoading;
  final String? error;

  AmbientState({
    required this.ambients,
    required this.ambientSummaries,
    this.isLoading = false,
    this.error,
  });

  AmbientState copyWith({
    List<Ambient>? ambients,
    Map<String, AmbientSummary>? ambientSummaries,
    bool? isLoading,
    String? error,
  }) {
    return AmbientState(
      ambients: ambients ?? this.ambients,
      ambientSummaries: ambientSummaries ?? this.ambientSummaries,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Define the StateNotifier
class AmbientNotifier extends StateNotifier<AmbientState> {
  final AmbientRepository _ambientRepository;
  final ExpenseRepository _expenseRepository; // Inject ExpenseRepository

  AmbientNotifier(this._ambientRepository, this._expenseRepository) : super(AmbientState(ambients: [], ambientSummaries: {})) {
    _loadAmbients();
  }

  Future<void> _loadAmbients() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // Watch ambients stream
      _ambientRepository.watchAllAmbients().listen(
        (ambients) {
          state = state.copyWith(ambients: ambients, isLoading: false);
          _loadAmbientSummaries(ambients); // Load summaries when ambients change
        },
        onError: (e) {
          state = state.copyWith(isLoading: false, error: 'Error loading ambients: $e');
        },
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error loading ambients: $e');
    }
  }

   // Load ambient summaries for the given list of ambients
  void _loadAmbientSummaries(List<Ambient> ambients) {
    final Map<String, AmbientSummary> currentSummaries = {};
    for (final ambient in ambients) {
      _expenseRepository.watchAmbientSummary(ambient.id).listen(
        (summary) {
          currentSummaries[ambient.id] = summary;
          state = state.copyWith(ambientSummaries: Map.from(currentSummaries)); // Update state with new summaries
        },
        onError: (e) {
           print('Error loading summary for ambient ${ambient.id}: $e'); // TODO: Log error properly
        }
      );
    }
  }


  Future<void> createAmbient(Ambient ambient) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _ambientRepository.createAmbient(ambient);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error creating ambient: $e');
    }
  }

  Future<void> updateAmbient(Ambient ambient) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _ambientRepository.updateAmbient(ambient);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error updating ambient: $e');
    }
  }

  Future<void> deleteAmbient(String ambientId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _ambientRepository.deleteAmbient(ambientId);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error deleting ambient: $e');
    }
  }
}

// Define the Riverpod provider
final ambientProvider = StateNotifierProvider<AmbientNotifier, AmbientState>(
  (ref) => AmbientNotifier(getIt<AmbientRepository>(), getIt<ExpenseRepository>()), // Inject ExpenseRepository
);
