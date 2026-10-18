const Video = (function() {

  function init() {
    console.log("Video module initialized");
  }

  function loadView(viewName) {
    console.log("Loading video view:", viewName);
  }

  function focusVideo(videoId) {
    console.log("Focusing video element:", videoId);
  }

  function toggleHud() {
    console.log("Toggling HUD overlay");
  }

  function toggleCameraView() {
    console.log("Toggling camera view");
  }

  return {
    init,
    loadView,
    focusVideo,
    toggleHud,
    toggleCameraView
  };

})();

// Expose to global scope
window.Video = Video;
window.loadView = Video.loadView;
window.focusVideo = Video.focusVideo;
window.toggleHud = Video.toggleHud;
window.toggleCameraView = Video.toggleCameraView;
