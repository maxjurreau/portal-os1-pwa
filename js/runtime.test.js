/* ==========================================
   PORTAL RUNTIME KERNEL v0.2 TEST SUITE
========================================== */

class InMemoryStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

async function runRuntimeTests() {
  console.log("=== STARTING PORTAL RUNTIME TESTS ====");
  const mockStorage = new InMemoryStorage();
  PortalRuntime.setStorageProvider(mockStorage);

  // Test 1: Schema Migration (0.1.0 -> 0.2.0)
  mockStorage.setItem("portal-state", JSON.stringify({ schemaVersion: "0.1.0" }));
  PortalRuntime.load();
  
  if (PortalRuntime.state.schemaVersion === "0.2.0" && PortalRuntime.state.narrative) {
    console.log("✅ Test 1 Passed: Schema migration successfully upgraded v0.1.0 state.");
  } else {
    console.error("❌ Test 1 Failed: Schema migration did not upgrade correctly.");
  }

  // Test 2: Corrupt State Recovery
  mockStorage.setItem("portal-state", "{broken-json");
  PortalRuntime.load();

  if (PortalRuntime.state.schemaVersion === "0.2.0" && PortalRuntime.state.session.id) {
    console.log("✅ Test 2 Passed: Corrupt storage handled safely with default fallback.");
  } else {
    console.error("❌ Test 2 Failed: Corrupt storage caused a kernel crash.");
  }

  // Test 3: State Persistence
  PortalRuntime.state.navigation.currentMap = "markets";
  PortalRuntime.save();
  
  // Re-load to confirm persistence
  PortalRuntime.load();
  if (PortalRuntime.state.navigation.currentMap === "markets") {
    console.log("✅ Test 3 Passed: State successfully saved and restored.");
  } else {
    console.error("❌ Test 3 Failed: State persistence lost map value.");
  }

  // Test 4: Simulation Cancellation Race Protection
  let events = [];
  PortalRuntime.EventBus.on("simulation.started", () => events.push("started"));
  PortalRuntime.EventBus.on("simulation.progress", () => events.push("progress"));
  PortalRuntime.EventBus.on("simulation.cancelled", () => events.push("cancelled"));
  PortalRuntime.EventBus.on("simulation.completed", () => events.push("completed"));

  PortalRuntime.runSimulation(100000);
  setTimeout(() => {
    PortalRuntime.cancelSimulation();
  }, 400);

  // Wait to verify no completion event fires after cancellation
  await new Promise(resolve => setTimeout(resolve, 1200));

  if (events.includes("started") && events.includes("cancelled") && !events.includes("completed")) {
    console.log("✅ Test 4 Passed: Simulation cancelled cleanly without race condition or completion.");
  } else {
    console.error("❌ Test 4 Failed: Simulation cancellation emitted unexpected events.", events);
  }

  // Test 5: Simulation Timeout Handling
  let timeoutEvents = [];
  PortalRuntime.EventBus.on("simulation.timeout", () => timeoutEvents.push("timeout"));
  
  PortalRuntime.setSimulationTimeout(400); // Shorten timeout for test
  PortalRuntime.runSimulation(50000);

  await new Promise(resolve => setTimeout(resolve, 800));

  if (timeoutEvents.includes("timeout")) {
    console.log("✅ Test 5 Passed: Simulation timeout correctly triggered and terminated.");
  } else {
    console.error("❌ Test 5 Failed: Simulation timeout failed to trigger.");
  }

  console.log("=== PORTAL RUNTIME TESTS COMPLETE ===");
}

// Automatically execute tests if loaded in environment
if (typeof window !== "undefined") {
  window.runRuntimeTests = runRuntimeTests;
}
