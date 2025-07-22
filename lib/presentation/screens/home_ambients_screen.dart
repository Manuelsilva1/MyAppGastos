import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:gestor_de_gastos/presentation/state/ambient_state.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:gestor_de_gastos/presentation/widgets/create_ambient_dialog.dart';
import 'package:intl/intl.dart'; // Import for date formatting

class HomeAmbientsScreen extends ConsumerWidget {
  const HomeAmbientsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ambientState = ref.watch(ambientProvider);
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.ambientsScreenTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              context.go('/settings');
            },
            tooltip: localizations.settingsScreenTitle,
          ),
        ],
      ),
      body: ambientState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ambientState.error != null
              ? Center(child: Text('${localizations.error}: ${ambientState.error}'))
              : ambientState.ambients.isEmpty
                  ? Center(child: Text(localizations.noAmbientsMessage)) // TODO: Add help tooltip
                  : ListView.builder(
                      itemCount: ambientState.ambients.length,
                      itemBuilder: (context, index) {
                        final ambient = ambientState.ambients[index];
                        final summary = ambientState.ambientSummaries[ambient.id]; // Get summary data

                        // Format last activity date
                        final lastActivityText = summary?.lastActivity != null
                            ? DateFormat.yMd().add_jm().format(summary!.lastActivity!) // TODO: Use ambient locale for formatting
                            : 'N/A'; // TODO: Localize N/A

                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          color: Color(ambient.color).withOpacity(0.2),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Color(ambient.color),
                              child: const Icon(Icons.folder, color: Colors.white),
                            ),
                            title: Text(ambient.name),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${localizations.ambientCurrencyLabel}: ${ambient.currencyCode}'),
                                Text('${localizations.ambientTotalExpensesLabel}: ${summary?.totalExpenses.toStringAsFixed(2) ?? '0.00'}'), // Display total expenses
                                Text('${localizations.ambientLastActivityLabel}: $lastActivityText'), // Display last activity date
                              ],
                            ),
                            onTap: () {
                              context.go('/ambient/${ambient.id}');
                            },
                            // TODO: Add swipe to delete/edit functionality
                          ),
                        );
                      },
                    ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showDialog(
            context: context,
            builder: (context) => const CreateAmbientDialog(),
          );
        },
        tooltip: localizations.createNewAmbientButtonTooltip,
        child: const Icon(Icons.add),
      ),
    );
  }
}
