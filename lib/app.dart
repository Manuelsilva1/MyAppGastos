import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:responsive_breakpoints/responsive_breakpoints.dart';
import 'package:google_fonts/google_fonts.dart'; // Import google_fonts

import 'router.dart';
// TODO: Import theme provider

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    // TODO: Watch theme provider for current theme mode

    const Color primarySeedColorLight = Colors.deepPurple;
    const Color primarySeedColorDark = Colors.blueGrey;

    // Define a common TextTheme using GoogleFonts
    final TextTheme appTextTheme = TextTheme(
      displayLarge: GoogleFonts.oswald(fontSize: 57, fontWeight: FontWeight.bold),
      titleLarge: GoogleFonts.roboto(fontSize: 22, fontWeight: FontWeight.w500),
      bodyMedium: GoogleFonts.openSans(fontSize: 14),
      labelLarge: GoogleFonts.roboto(fontSize: 14, fontWeight: FontWeight.w500), // Added for button text
      bodySmall: GoogleFonts.openSans(fontSize: 12), // Added for smaller text
    );


    // Light Theme
    final ThemeData lightTheme = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primarySeedColorLight,
        brightness: Brightness.light,
      ),
      textTheme: appTextTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: primarySeedColorLight,
        foregroundColor: Colors.white,
        titleTextStyle: GoogleFonts.oswald(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          foregroundColor: Colors.white,
          backgroundColor: primarySeedColorLight,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          textStyle: appTextTheme.labelLarge,
        ),
      ),
       cardTheme: CardTheme(
        color: primarySeedColorLight.shade50,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primarySeedColorLight,
        foregroundColor: Colors.white,
      ),
       listTileTheme: ListTileThemeData(
        tileColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );

    // Dark Theme
    final ThemeData darkTheme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primarySeedColorDark,
        brightness: Brightness.dark,
      ),
      textTheme: appTextTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: primarySeedColorDark.shade900,
        foregroundColor: Colors.white,
         titleTextStyle: GoogleFonts.oswald(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
         iconTheme: const IconThemeData(color: Colors.white),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          foregroundColor: Colors.black,
          backgroundColor: primarySeedColorDark.shade200,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
           textStyle: appTextTheme.labelLarge,
        ),
      ),
       cardTheme: CardTheme(
        color: primarySeedColorDark.shade800,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
       floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primarySeedColorDark.shade200,
        foregroundColor: Colors.black,
      ),
       listTileTheme: ListTileThemeData(
        tileColor: primarySeedColorDark.shade800,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
         contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );

    // TODO: Get themeMode from theme provider
    const ThemeMode themeMode = ThemeMode.system;


    return MaterialApp.router(
      title: AppLocalizations.of(context)!.appTitle,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', ''), // English
        Locale('es', ''), // Spanish
        // TODO: Add ES-AR and EN-US specific locales if needed for variations
      ],
      // TODO: Set locale based on user settings
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: themeMode, // Use themeMode from provider
      routerConfig: router,
      builder: (context, child) => ResponsiveBreakpoints.builder(
        child: child! ,
        breakpoints: [
          const Breakpoint(start: 0, end: 450, name: MOBILE),
          const Breakpoint(start: 451, end: 800, name: TABLET),
          const Breakpoint(start: 801, end: 1920, name: DESKTOP),
          const Breakpoint(start: 1921, end: double.infinity, name: FOURK),
        ],
      ),
    );
  }
}
