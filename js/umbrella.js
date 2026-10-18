const Umbrella = (function() {

  function init() {
    console.log("Umbrella module initialized");
  }

  return {
    init
  };

})();

// Expose to global scope
window.Umbrella = Umbrella;
