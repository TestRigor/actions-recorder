import 'session-management-js';
import Recorder from './recorder/recorder.js';

function init(options) {
  window['Recorder'] = new Recorder(options);
  window['TestRigorRecorder'] = window['Recorder'];

  return window.Recorder;
}

// Left for backward compatibility
document.addEventListener('restartWithCustomConfigRequested', function (event) {
  window.Recorder.restartWithConfig(event.detail);
});

export { init };
