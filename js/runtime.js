/* ==========================================
   PORTAL RUNTIME KERNEL v0.2
   Operating Layer: Portal-OS
   Simulation Architecture: MAX-SIM
   Governance Flow: Identity -> Simulation -> Narrative
========================================== */

const PortalRuntime = (() => {

  const SCHEMA_VERSION = "0.2.0";
  const STORAGE_KEY = "portal-state";

  const DEFAULT_STATE = {
    schemaVersion: SCHEMA_VERSION,
    session: {
      id: null,
      startedAt: null
    },
    navigation: {
      currentMap: "physics",
      currentRoute: "/physics"
    },
    worker: {
      online: false,
      lastUpdate: null,
      lastError: null,
      lastData: null,
      lastGoodData: null
    },
    simulation: {
      running: false,
      cancelled: false,
      progress: 0,
      iterations: 0,
      coherence: 97.4,
      probability: 68.2
    },
    telemetry: {
      armSlot: 64.2,
      separation: 3.1
    },
    narrative: {
      state: "idle",
      summary: null,
      lastGenerated: null
    },
    console: [],
    ui: {
      hudEnabled: true,
      theme: "dark"
    }
  };

  /* ==========================================
     1. STATE STORE (IMMUTABLE REFERENCE)
  ========================================== */
  const state = structuredClone(DEFAULT_STATE);

  function replaceState(migrated){
    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, migrated);
  }

  /* ==========================================
     2. EVENT BUS (ISOLATED DISPATCHER)
  ========================================== */
  const EventBus = {
    handlers: {},
    on(event, fn){
      if(!this.handlers[event]){
        this.handlers[event] = [];
      }
      this.handlers[event].push(fn);
    },
    emit(event, payload){
      (this.handlers[event] || []).forEach(fn => {
        try {
          fn(payload);
        }
        catch(err){
          console.error(`EventBus error on [${event}]:`, err);
        }
      });
    }
  };

  /* ==========================================
     3. SCHEMA MIGRATION ENGINE
  ========================================== */
  function migrateState(incoming){
    if(!incoming){
      return structuredClone(DEFAULT_STATE);
    }
    const version = incoming.schemaVersion || "0.1.0";
    
    if(version === "0.1.0"){
      incoming.narrative = {
        state: "idle",
        summary: null,
        lastGenerated: null
      };
      incoming.schemaVersion = SCHEMA_VERSION;
      EventBus.emit("state.migrated", { from: "0.1.0", to: SCHEMA_VERSION });
    }

    return {
      ...structuredClone(DEFAULT_STATE),
      ...incoming
    };
  }

  /* ==========================================
     4. PERSISTENCE LAYER
  ========================================== */
  function save(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      EventBus.emit("state.saved", state);
    }
    catch(error){
      console.warn("State save failed", error);
    }
  }

  function load(){
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved){
        const parsed = JSON.parse(saved);
        const migrated = migrateState(parsed);
        replaceState(migrated);
      } else {
        state.session.id = "sess_" + Math.random().toString(36).substring(2, 9);
        state.session.startedAt = Date.now();
        save();
      }
      EventBus.emit("state.loaded", state);
    }
    catch(error){
      console.warn("State load failed, falling back to defaults", error);
      replaceState(structuredClone(DEFAULT_STATE));
      save();
      EventBus.emit("state.loaded", state);
    }
  }

  /* ==========================================
     5. ROUTER & MAP VALIDATION
  ========================================== */
  const VALID_MAPS = ["physics", "compute", "simulation", "cognition", "markets"];

  function route(){
    let targetRoute = location.hash.replace("#/", "").trim().toLowerCase();
    
    if(!VALID_MAPS.includes(targetRoute)){
      targetRoute = "physics";
      if(location.hash !== "#/physics" && location.hash !== "") {
        location.hash = "/physics";
      }
    }

    state.navigation.currentRoute = "/" + targetRoute;
    state.navigation.currentMap = targetRoute;
    save();

    EventBus.emit("route.changed", targetRoute);
    EventBus.emit("map.changed", targetRoute);
  }

  /* ==========================================
     6. SIMULATION RUNNER (CENTRALIZED CLEANUP & FINISHED LOCK)
  ========================================== */
  let activeSimulation = null;
  let simulationTimeout = null;
  let simulationFinished = false;
  const SIM_TIMEOUT_MS = 30000;

  function clearSimulationTimers(){
    if(activeSimulation){
      clearInterval(activeSimulation);
      activeSimulation = null;
    }
    if(simulationTimeout){
      clearTimeout(simulationTimeout);
      simulationTimeout = null;
    }
  }

  function runSimulation(iterations = 100000){
    if(state.simulation.running){
      EventBus.emit("simulation.rejected", { reason: "already-running" });
      return;
    }

    state.simulation.running = true;
    state.simulation.cancelled = false;
    state.simulation.progress = 0;
    simulationFinished = false;

    EventBus.emit("simulation.started", { iterations });

    simulationTimeout = setTimeout(() => {
      if(simulationFinished) return;
      simulationFinished = true;
      EventBus.emit("simulation.timeout");
      cancelSimulation();
    }, SIM_TIMEOUT_MS);

    activeSimulation = setInterval(() => {
      try {
        if(simulationFinished || !state.simulation.running || state.simulation.cancelled){
          clearSimulationTimers();
          return;
        }

        state.simulation.progress += 10;
        EventBus.emit("simulation.progress", { progress: state.simulation.progress });

        if(state.simulation.progress >= 100){
          if(simulationFinished) return;
          simulationFinished = true;

          clearSimulationTimers();

          state.simulation.running = false;
          state.simulation.iterations += iterations;
          state.simulation.coherence = (95 + Math.random() * 5).toFixed(1);
          state.simulation.probability = (50 + Math.random() * 40).toFixed(1);

          EventBus.emit("simulation.completed", state.simulation);
          save();
        }
      }
      catch(error){
        if(simulationFinished) return;
        simulationFinished = true;

        clearSimulationTimers();
        state.simulation.running = false;
        EventBus.emit("simulation.error", { message: error.message });
      }
    }, 300);
  }

  function cancelSimulation(){
    if(simulationFinished && !state.simulation.running) return;
    simulationFinished = true;
    clearSimulationTimers();
    state.simulation.cancelled = true;
    state.simulation.running = false;
    EventBus.emit("simulation.cancelled");
  }

  /* ==========================================
     7. NARRATIVE ENGINE (IDENTITY → SIM → NARRATIVE)
  ========================================== */
  let generatingNarrative = false;

  function generateNarrative(simulation){
    if(generatingNarrative || state.narrative.state === "generating"){
      return;
    }
    generatingNarrative = true;

    try {
      state.narrative.state = "generating";
      EventBus.emit("narrative.generating", state.narrative);

      const probability = Number(simulation.probability);
      let summary;

      if(probability > 80){
        summary = "High confidence scenario projection.";
      } else if(probability > 60){
        summary = "Stable projected outcome.";
      } else {
        summary = "Low confidence scenario trajectory.";
      }

      state.narrative.state = "generated";
      state.narrative.summary = summary;
      state.narrative.lastGenerated = Date.now();
      save();

      EventBus.emit("narrative.generated", state.narrative);
    }
    finally {
      generatingNarrative = false;
    }
  }

  EventBus.on("simulation.completed", (simulation) => {
    generateNarrative(simulation);
  });

  /* ==========================================
     8. WORKER POLLING (OVERLAP-LOCKED & JSON SAFE)
  ========================================== */
  let workerPollRunning = false;

  async function pollWorker(){
    if(workerPollRunning){
      return;
    }
    workerPollRunning = true;

    EventBus.emit("worker.poll.started");

    if(!navigator.onLine){
      state.worker.online = false;
      state.worker.lastError = "Offline";
      EventBus.emit("worker.error", new Error("Offline"));
      workerPollRunning = false;
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://portal-os1.maxchaz2.workers.dev/api/health", {
        signal: controller.signal,
        cache: "no-store"
      });

      clearTimeout(timeout);

      if(!response.ok){
        throw new Error("HTTP " + response.status);
      }

      const raw = await response.text();
      let data;

      try {
        data = JSON.parse(raw);
      }
      catch {
        data = {
          raw,
          status: "text-response"
        };
      }

      state.worker.online = true;
      state.worker.lastData = data;
      state.worker.lastGoodData = data;
      state.worker.lastUpdate = Date.now();
      state.worker.lastError = null;
      save();

      EventBus.emit("worker.updated", data);
    }
    catch(error){
      state.worker.online = false;
      state.worker.lastError = error.message;
      EventBus.emit("worker.error", error);
    }
    finally {
      workerPollRunning = false;
    }
  }

  /* ==========================================
     9. BOOT SEQUENCE
  ========================================== */
  function boot(){
    load();
    route();
    window.addEventListener("hashchange", route);

    pollWorker();
    setInterval(pollWorker, 10000);

    EventBus.emit("portal.boot");
    EventBus.emit("portal.ready");
  }

  return {
    boot,
    runSimulation,
    cancelSimulation,
    save,
    load,
    state,
    EventBus
  };

})();
