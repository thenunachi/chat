let ctx = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
function tone(freq, startOffset, duration, vol = 0.18, type = "sine") {
  const c = ac();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, c.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration);
  osc.start(c.currentTime + startOffset);
  osc.stop(c.currentTime + startOffset + duration);
}
export function playJoin()    { tone(523,0,.22); tone(659,.1,.22); tone(784,.2,.32); }
export function playLeave()   { tone(784,0,.22,.14); tone(659,.1,.22,.14); tone(523,.2,.32,.14); }
export function playMessage() { tone(880,0,.1,.14); tone(1108,.07,.1,.1); }
export function playSent()    { tone(1200,0,.08,.08); }
