import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/portal_provider.dart';

class PortalDashboardView extends ConsumerWidget {
  const PortalDashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final processesAsync = ref.watch(portalProcessProvider);
    final endpoint = ref.watch(portalEndpointProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portal-OS1 Edge Hypervisor'),
        backgroundColor: Colors.black87,
        foregroundColor: Colors.greenAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_box),
            tooltip: 'Spawn Virtual Process',
            onPressed: () async {
              final notifier = ref.read(portalProcessProvider.notifier);
              await notifier.spawnProcess(
                'pid_${DateTime.now().millisecondsSinceEpoch}',
                {'origin': 'pwa_ui', 'status': 'active'},
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.grey[900],
            width: double.infinity,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SYSTEM: ONLINE | COST: $0.00/mo',
                    style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Endpoint: $endpoint',
                    style: const TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
          Expanded(
            child: processesAsync.when(
              data: (processes) {
                if (processes.isEmpty) {
                  return const Center(
                    child: Text('No active virtual processes. Tap [+] to spawn one.',
                        style: TextStyle(color: Colors.grey)),
                  );
                }
                return ListView.builder(
                  itemCount: processes.length,
                  itemBuilder: (context, index) {
                    final proc = processes[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      child: ListTile(
                        leading: const Icon(Icons.bolt, color: Colors.amber),
                        title: Text(proc['pid'] ?? 'Unknown PID',
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Owner: ${proc['owner_id'] ?? 'N/A'} | Priority: ${proc['priority'] ?? 0}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.restore, color: Colors.redAccent),
                          tooltip: 'Trigger Epoch Rollback',
                          onPressed: () async {
                            final notifier = ref.read(portalProcessProvider.notifier);
                            await notifier.triggerRecovery(proc['pid']);
                          },
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(
                child: Text('Kernel Error: $err', style: const TextStyle(color: Colors.red)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
