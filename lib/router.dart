import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

// TODO: Create actual screen widgets
import 'package:gestor_de_gastos/presentation/screens/home_ambients_screen.dart';
import 'package:gestor_de_gastos/presentation/screens/ambient_dashboard_screen.dart';
import 'package:gestor_de_gastos/presentation/screens/expense_form_screen.dart';
import 'package:gestor_de_gastos/presentation/screens/expense_detail_screen.dart';
import 'package:gestor_de_gastos/presentation/screens/settings_screen.dart';

part 'router.g.dart';

@riverpod
GoRouter goRouter(GoRouterRef ref) => GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeAmbientsScreen(), // TODO: Add Splash and DecideAuth logic
        ),
        GoRoute(
          path: '/ambient/:id',
          builder: (context, state) => AmbientDashboardScreen(ambientId: state.pathParameters['id']!),
          routes: [
            GoRoute(
              path: 'new',
              builder: (context, state) => ExpenseFormScreen(ambientId: state.pathParameters['id']!), // TODO: Pass expenseId for editing
            ),
            GoRoute(
              path: ':eid',
              builder: (context, state) => ExpenseDetailScreen(
                ambientId: state.pathParameters['id']!,
                expenseId: state.pathParameters['eid']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    );
