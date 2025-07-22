import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart'; // Import SharedPreferences
import 'dart:ui'; // Import for Locale


// Define the state for the SettingsNotifier
class SettingsState {
  final ThemeMode themeMode;
  final Locale locale;
  final String defaultCurrency;
  final bool biometryEnabled;
  final bool isLoading;

  SettingsState({
    required this.themeMode,
    required this.locale,
    required this.defaultCurrency,
    required this.biometryEnabled,
    this.isLoading = false,
  });

  SettingsState copyWith({
    ThemeMode? themeMode,
    Locale? locale,
    String? defaultCurrency,
    bool? biometryEnabled,
    bool? isLoading,
  }) {
    return SettingsState(
      themeMode: themeMode ?? this.themeMode,
      locale: locale ?? this.locale,
      defaultCurrency: defaultCurrency ?? this.defaultCurrency,
      biometryEnabled: biometryEnabled ?? this.biometryEnabled,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// Define the StateNotifier for settings
class SettingsNotifier extends StateNotifier<SettingsState> {
  late SharedPreferences _prefs; // Use late to initialize in _loadSettings

  SettingsNotifier() : super(SettingsState(
    themeMode: ThemeMode.system, // Default
    locale: const Locale('en'), // Default
    defaultCurrency: 'USD', // Default
    biometryEnabled: false, // Default
  )) {
    _loadSettings(); // Load settings when notifier is created
  }

  Future<void> _initPrefs() async {
     _prefs = await SharedPreferences.getInstance();
  }

  Future<void> _loadSettings() async {
    state = state.copyWith(isLoading: true);
     await _initPrefs();

    final themeModeIndex = _prefs.getInt('themeMode') ?? 0;
    final localeCode = _prefs.getString('locale') ?? 'en';
    final defaultCurrency = _prefs.getString('defaultCurrency') ?? 'USD';
    final biometryEnabled = _prefs.getBool('biometryEnabled') ?? false;

    state = state.copyWith(
      themeMode: ThemeMode.values[themeModeIndex],
      locale: Locale(localeCode),
      defaultCurrency: defaultCurrency,
      biometryEnabled: biometryEnabled,
      isLoading: false,
    );
  }

  Future<void> setThemeMode(ThemeMode themeMode) async {
    state = state.copyWith(themeMode: themeMode);
     await _prefs.setInt('themeMode', themeMode.index);
  }

  Future<void> setLocale(Locale locale) async {
    state = state.copyWith(locale: locale);
     await _prefs.setString('locale', locale.languageCode);
  }

  Future<void> setDefaultCurrency(String currencyCode) async {
    state = state.copyWith(defaultCurrency: currencyCode);
     await _prefs.setString('defaultCurrency', currencyCode);
  }

  Future<void> setBiometryEnabled(bool enabled) async {
     // TODO: Check for biometric availability before enabling
    state = state.copyWith(biometryEnabled: enabled);
     await _prefs.setBool('biometryEnabled', enabled);
  }
}

// Define the Riverpod provider for the settings state
final settingsProvider = StateNotifierProvider<SettingsNotifier, SettingsState>(
  (ref) => SettingsNotifier(),
);
