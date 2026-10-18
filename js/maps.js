const Maps = (function() {
  let currentMap = null;

  async function loadAll() {
    console.log("Maps module initialized");
    // Add your initialization/loading logic here
  }

  async function selectMap(name) {
    try {
      const response = await fetch('/maps/' + name + '.json');
      if (!response.ok) {
        throw new Error(`Failed to load map: ${response.statusText}`);
      }
      currentMap = await response.json();
      console.log("Loaded map:", currentMap);
    } catch (error) {
      console.error("Error in selectMap:", error);
    }
  }

  function exportMaps() {
    console.log("Exporting maps data...");
  }

  function importMaps() {
    console.log("Importing maps data...");
  }

  return {
    init: loadAll,
    selectMap,
    exportMaps,
    importMaps
  };

})();

// Expose to global scope for inline onclick handlers and script tags
window.Maps = Maps;
window.selectMap = Maps.selectMap;
window.exportMaps = Maps.exportMaps;
window.importMaps = Maps.importMaps;
