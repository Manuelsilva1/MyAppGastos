import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:gestor_de_gastos/presentation/state/settings_state.dart'; // Import settings provider
import 'package:local_auth/local_auth.dart'; // Import local_auth

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _checkBiometryAvailability(BuildContext context, WidgetRef ref) async {
    final localAuth = LocalAuthentication();
    bool canCheckBiometrics = await localAuth.canCheckBiometrics;
    final localizations = AppLocalizations.of(context)!;

    if (!canCheckBiometrics) {
      // Show a message to the user that biometry is not available
       ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(localizations.biometryNotAvailableMessage), // TODO: Localize
        ),
      );
       // Disable biometry toggle if not available
       ref.read(settingsProvider.notifier).setBiometryEnabled(false); // Ensure the state is updated
    }
  }


  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsState = ref.watch(settingsProvider);
    final settingsNotifier = ref.read(settingsProvider.notifier);
    final localizations = AppLocalizations.of(context)!;

    // Check biometry availability when the screen is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
       _checkBiometryAvailability(context, ref);
    });


    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.settingsScreenTitle),
      ),
      body: settingsState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // Theme Selection
                ListTile(
                  title: Text(localizations.themeSettingTitle), // TODO: Localize
                  trailing: DropdownButton<ThemeMode>(
                    value: settingsState.themeMode,
                    onChanged: (ThemeMode? newValue) {
                      if (newValue != null) {
                        settingsNotifier.setThemeMode(newValue);
                      }
                    },
                    items: const [
                      DropdownMenuItem(+
                        value: ThemeMode.system,
                        child: Text('Sistema'), // TODO: Localize
                      ),
                      DropdownMenuItem(
                        value: ThemeMode.light,
                        child: Text('Claro'), // TODO: Localize
                      ),
                      DropdownMenuItem(
                        value: ThemeMode.dark,
                        child: Text('Oscuro'), // TODO: Localize
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // Language Selection
                ListTile(
                  title: Text(localizations.languageSettingTitle), // TODO: Localize
                  trailing: DropdownButton<Locale>(
                    value: settingsState.locale,
                    onChanged: (Locale? newValue) {
                      if (newValue != null) {
                        settingsNotifier.setLocale(newValue);
                        // TODO: Relaunch or update app to reflect language change
                      } else {
                        // Handle case where newValue is null (shouldn't happen with non-nullable type, but good practice)
                      }
                    },
                    items: const [
                      DropdownMenuItem(
                        value: Locale('en'),
                        child: Text('English'), // TODO: Localize in English
                      ),
                      DropdownMenuItem(
                        value: Locale('es'),
                        child: Text('Español (España)'), // TODO: Localize in Spanish
                      ),
                       // TODO: Add ES-AR and EN-US options
                    ],
                  ),
                ),
                const Divider(),
                // Default Currency Setting
                 ListTile(
                  title: Text(localizations.defaultCurrencySettingTitle), // TODO: Localize
                   trailing: DropdownButton<String>(
                    value: settingsState.defaultCurrency,
                    onChanged: (String? newValue) {
                      if (newValue != null) {
                        settingsNotifier.setDefaultCurrency(newValue);+
                      }
                    },
                    items: const [ // TODO: Load available currencies dynamically
                      DropdownMenuItem(value: 'USD', child: Text('USD')),
                      DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                      DropdownMenuItem(value: 'ARS', child: Text('ARS')), // Example for ES-AR
                    ],
                  ),
                ),
                const Divider(),
                // Biometry Authentication Toggle
                ListTile(
                  title: Text(localizations.biometrySettingTitle), // TODO: Localize
                  trailing: Switch(
                    value: settingsState.biometryEnabled,
                     onChanged: (bool newValue) async {
                       // Check biometry availability before enabling
                       final localAuth = LocalAuthentication();
                       bool canCheckBiometrics = await localAuth.canCheckBiometrics;
                       if (newValue && !canCheckBiometrics) {
                         // Show message if trying to enable but not available
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(localizations.biometryNotAvailableMessage), // TODO: Localize
                            ),+
                          );
                       } else {
                          settingsNotifier.setBiometryEnabled(newValue);+
                       }
                     },
                  ),+
                ),
              ],
            ),
    );+
  }
}
