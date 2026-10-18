const MAXSIM = (function() {

  function init() {
    console.log("MAXSIM module initialized");
  }

  function runSim() {
    console.log("Running simulation...");
  }

  return {
    init,
    runSim
  };

})();

// Expose to global scope
window.MAXSIM = MAXSIM;
window.runSim = MAXSIM.runSim;
