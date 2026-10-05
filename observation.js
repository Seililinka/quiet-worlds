// Reuse the live inspector and journal; no duplicated simulation or sound.
const panel = document.querySelector('.observation-panel');
const controls = panel.querySelector('.observation-tabs');
const buttons = [...controls.querySelectorAll('button')];

function show(view) {
  panel.dataset.view = view;
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
}

controls.hidden = false;
for (const button of buttons) {
  button.addEventListener('click', () => show(button.dataset.view));
}

// A map selection or a journal entry always brings the resident into view.
document.getElementById('world').addEventListener('pointerup', () => show('resident'));
document.getElementById('agent-select').addEventListener('change', () => show('resident'));
const journal = document.getElementById('events');
journal.addEventListener('click', event => {
  if (event.target.closest('[role="button"]')) show('resident');
});
journal.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[role="button"]')) {
    show('resident');
  }
});
