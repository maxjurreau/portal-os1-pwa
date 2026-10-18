/* ==========================
   PORTAL RUNTIME V0.2
========================== */

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
      summary: null
    },
    console: [],
    ui: {
      hudEnabled: true,
      theme: "dark"
    }
  };

  let state = structuredClone(DEFAULT_STATE);

  /* ==========================
     EVENT BUS
  ========================== */
  const EventBus = {
    handlers: {},
    on(event, callback){
      if(!this.handlers[event]){
        this.handlers[event] = [];
      }
      this.handlers[event].push(callback);
    },
    emit(event, payload){
      (this.handlers[event] || []).forEach(listener => {
        try{
          listener(payload);
        }
        catch(error){
          console.error(event, error);
        }
      });
    }
  };

  /* ==========================
     MIGRATION ENGINE
  ========================== */
  function migrateState(incoming){
    if(!incoming){
      return structuredClone(DEFAULT_STATE);
    }
    const version = incoming.schemaVersion || "0.1.0";
    if(version === "0.1.0"){
      incoming.narrative = {
        state: "idle",
        summary: null
      };
      incoming.schemaVersion = "0.2.0";
    }
    return {
      ...structuredClone(DEFAULT_STATE),
      ...incoming
    };
  }

  /* ==========================
     STORAGE
  ========================== */
  function save(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      EventBus.emit("state.saved");
    }
    catch(error){
      console.warn("Save failed", error);
    }
  }

  function load(){
    try{
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved){
        state = migrateState(JSON.parse(saved));
      } else {
        state.session.id = "sess_" + Math.random().toString(36).substring(2, 9);
        state.session.startedAt = Date.now();
        save();
      }
      EventBus.emit("state.loaded", state);
    }
    catch(error){
      console.warn("Load failed", error);
      EventBus.emit("state.loaded", state);
    }
  }

  /* ==========================
     ROUTER
  ========================== */
  function route(){
    const currentRoute = location.hash.replace("#/", "").trim() || "physics";
    state.navigation.currentRoute = "/" + currentRoute;
    state.navigation.currentMap = currentRoute;
    save();
    EventBus.emit("route.changed", currentRoute);
  }

  /* ==========================
     SIMULATION ENGINE
  ========================== */
  function runSimulation(iterations = 100000){
    state.simulation.running = true;
    EventBus.emit("simulation.started", { iterations });

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      EventBus.emit("simulation.progress", { progress });

      if(progress >= 100){
        clearInterval(interval);
        state.simulation.running = false;
        state.simulation.iterations += iterations;
        state.simulation.coherence = (95 + Math.random() * 5).toFixed(1);
        state.simulation.probability = (50 + Math.random() * 40).toFixed(1);
        save();

        EventBus.emit("simulation.completed", state.simulation);
      }
    }, 250);
  }

  /* ==========================
     NARRATIVE ENGINE
  ========================== */
  function generateNarrative(){
    const probability = Number(state.simulation.probability);
    let summary;

    if(probability > 75){
      summary = "Strong simulation outcome with high confidence stability.";
    } else if(probability > 60){
      summary = "Moderate confidence outcome with stable system parameters.";
    } else {
      summary = "Uncertain outcome trajectory. Continuous monitoring advised.";
    }

    state.narrative.state = "generated";
    state.narrative.summary = summary;
    save();

    EventBus.emit("narrative.generated", state.narrative);
  }

  /* ==========================
     WORKER POLLER
  ========================== */
  async function pollWorker(){
    EventBus.emit("worker.poll.started");

    if(!navigator.onLine){
      state.worker.online = false;
      state.worker.lastError = "Offline";
      EventBus.emit("worker.error", new Error("Offline"));
      return;
    }

    try{
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

      try{
        data = JSON.parse(raw);
      }
      catch{
        data = { raw, status: "text-response" };
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
  }

  /* ==========================
     SUBSCRIBER BINDINGS
  ========================== */
  EventBus.on("simulation.completed", () => {
    generateNarrative();
  });

  /* ==========================
     BOOT
  ========================== */
  function boot(){
    load();
    route();
    window.addEventListener("hashchange", route);

    pollWorker();
    setInterval(pollWorker, 10000);

    EventBus.emit("portal.ready");
  }

  return {
    boot,
    runSimulation,
    save,
    load,
    state,
    EventBus
  };

})();
