import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'app.dart';
import 'firebase_options.dart';
import 'utils/service_locator.dart'; // Import service locator

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Setup GetIt locator
  setupLocator();

  // TODO: Implement anonymous authentication logic
  // TODO: Check for existing user and decide whether to use local or cloud data

  runApp(const ProviderScope(child: MyApp()));
}