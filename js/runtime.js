/* ==========================
   PORTAL RUNTIME V0.2.1
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

  /* The state object reference never changes */
  const state = structuredClone(DEFAULT_STATE);

  function replaceState(next){
    Object.keys(state).forEach(key => {
      delete state[key];
    });
    Object.assign(state, next);
  }

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
        summary: null,
        lastGenerated: null
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
        const parsed = JSON.parse(saved);
        replaceState(migrateState(parsed));
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
     SIMULATION ENGINE (ROBUST)
  ========================== */
  let activeSimulation = null;
  let simulationTimeout = null;

  function runSimulation(iterations = 100000){
    if(state.simulation.running){
      EventBus.emit("simulation.rejected", { reason: "already-running" });
      return;
    }

    state.simulation.running = true;
    state.simulation.cancelled = false;
    state.simulation.progress = 0;

    EventBus.emit("simulation.started", { iterations });

    simulationTimeout = setTimeout(() => {
      EventBus.emit("simulation.timeout");
      cancelSimulation();
    }, 30000);

    activeSimulation = setInterval(() => {
      try {
        if(state.simulation.cancelled){
          throw new Error("cancelled");
        }

        state.simulation.progress += 10;
        EventBus.emit("simulation.progress", { progress: state.simulation.progress });

        if(state.simulation.progress >= 100){
          clearInterval(activeSimulation);
          clearTimeout(simulationTimeout);

          state.simulation.running = false;
          state.simulation.iterations += iterations;
          state.simulation.coherence = (95 + Math.random() * 5).toFixed(1);
          state.simulation.probability = (50 + Math.random() * 40).toFixed(1);

          EventBus.emit("simulation.completed", state.simulation);
          save();
        }
      }
      catch(error){
        clearInterval(activeSimulation);
        clearTimeout(simulationTimeout);
        state.simulation.running = false;
        EventBus.emit("simulation.error", { message: error.message });
      }
    }, 300);
  }

  function cancelSimulation(){
    clearInterval(activeSimulation);
    clearTimeout(simulationTimeout);
    state.simulation.cancelled = true;
    state.simulation.running = false;
    EventBus.emit("simulation.cancelled");
  }

  /* ==========================
     NARRATIVE ENGINE
  ========================== */
  function generateNarrative(simulation){
    const probability = Number(simulation.probability);
    let summary;

    if(probability > 80){
      summary = "High confidence scenario.";
    } else if(probability > 60){
      summary = "Stable projected outcome.";
    } else {
      summary = "Low confidence scenario.";
    }

    state.narrative.state = "generated";
    state.narrative.summary = summary;
    state.narrative.lastGenerated = Date.now();
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
     EVENT SUBSCRIBER BINDINGS
  ========================== */
  EventBus.on("simulation.completed", (simulation) => {
    generateNarrative(simulation);
  });

  /* Console Logger Helper */
  EventBus.on("console.message", (message) => {
    const el = document.getElementById("console");
    if(!el) return;
    el.innerHTML += `<br>${message}`;
    el.scrollTop = el.scrollHeight;
  });

  function log(message){
    EventBus.emit("console.message", message);
  }

  /* HUD & Status Handlers */
  EventBus.on("worker.updated", () => {
    const status = document.getElementById("workerStatus");
    if(status){
      status.innerText = "ONLINE";
      status.style.color = "#22c55e";
    }
  });

  EventBus.on("simulation.progress", (payload) => {
    const progress = document.getElementById("simProgress");
    if(progress){
      progress.innerText = payload.progress + "%";
    }
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
    cancelSimulation,
    save,
    load,
    state,
    EventBus,
    log
  };

})();
