import 'session-management-js';
import Recorder from './recorder/recorder.js';

function init(options) {
  window['Recorder'] = new Recorder(options);

  return window.Recorder;
}

document.addEventListener('recorderLibraryContextRequested', function (event) {
  document.dispatchEvent(new CustomEvent('recorderLibraryContextProvisioned', {
    detail: { version: window.Recorder.getVersion(), config: window.Recorder.getConfig() }
  }));
});

document.addEventListener('restartWithCustomConfigRequested', function (event) {
  window.Recorder.restartWithConfig(event.detail);
});

export { init };
