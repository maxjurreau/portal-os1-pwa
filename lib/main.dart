import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'views/portal_dashboard_view.dart';

void main() {
  runApp(
    const ProviderScope(
      child: PortalApp(),
    ),
  );
}

class PortalApp extends StatelessWidget {
  const PortalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Portal-OS1 Dashboard',
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.green,
      ),
      home: const PortalDashboardView(),
      debugShowCheckedModeBanner: false,
    );
  }
}
