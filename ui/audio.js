
// ui/audio.js — procedural cartoon music + click SFX (no external files)
(function(){
  let ctx, musicGain, clickGain, started = false;
  let masterEnabled = true;
  let musicVol = +localStorage.getItem('kidsMusicVol') || 0.35;
  let musicMuted = localStorage.getItem('kidsMusicMuted') === '1';

  function ensureCtx(){
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = ctx.createGain(); musicGain.gain.value = musicMuted ? 0 : musicVol;
      clickGain = ctx.createGain(); clickGain.gain.value = 0.25;
      musicGain.connect(ctx.destination);
      clickGain.connect(ctx.destination);
      // build loop
      buildCartoonLoop();
    }
  }

  function env(node, v=1, a=0.005, d=0.08, s=0.6, r=0.15){
    const now = ctx.currentTime;
    const g = ctx.createGain();
    node.connect(g); g.connect(clickGain);
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, v), now+a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, v*s), now+a+d);
    g.gain.exponentialRampToValueAtTime(0.0001, now+a+d+r);
  }

  function click(){
    if (!masterEnabled) return;
    ensureCtx();
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.06);
    env(o, 0.9, 0.003, 0.05, 0.2, 0.08);
    o.start(); o.stop(ctx.currentTime + 0.2);
  }

  // Simple happy cartoon loop (two voices + bass + hat)
  let loopNodes = [];
  function buildCartoonLoop(){
    const tempo = 120; // bpm
    const beat = 60/tempo;
    const bar = beat*4;
    function mkOsc(type, freq){
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.0;
      o.connect(g); g.connect(musicGain);
      return {o,g};
    }

    // chords (saw)
    const chords = [[261.63, 329.63, 392.00],[293.66,369.99,440.00],[329.63,415.30,493.88],[261.63,329.63,392.00]];
    chords.forEach((tri, i)=>{
      tri.forEach((f)=>{
        const {o,g} = mkOsc('sawtooth', f);
        const t0 = ctx.currentTime + i*bar;
        o.start(t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.06, t0 + 0.15);
        g.gain.linearRampToValueAtTime(0.02, t0 + bar - 0.05);
        o.stop(t0 + bar);
        loopNodes.push(o,g);
      });
    });

    // melody (square)
    const mel = [784,784,880,784,659,698,587,0,784,784,880,784,880,987,880];
    mel.forEach((f,i)=>{
      if(!f) return;
      const {o,g} = mkOsc('square', f);
      const t0 = ctx.currentTime + (i*beat);
      o.start(t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.07, t0 + 0.05);
      g.gain.linearRampToValueAtTime(0.02, t0 + beat - 0.02);
      o.stop(t0 + beat);
      loopNodes.push(o,g);
    });

    // hat
    for(let i=0;i<16;i++){
      const t0 = ctx.currentTime + i*beat;
      const noise = ctx.createOscillator();
      noise.type = 'triangle'; noise.frequency.value = 8000;
      const g = ctx.createGain(); g.gain.value = 0;
      noise.connect(g); g.connect(musicGain);
      noise.start(t0);
      g.gain.setValueAtTime(0.05, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
      noise.stop(t0 + 0.04);
      loopNodes.push(noise,g);
    }

    // schedule next loop
    const dur = bar*4;
    setTimeout(()=>{
      if (masterEnabled && ctx && ctx.state!=='closed') buildCartoonLoop();
    }, dur*1000 - 50);
  }

  // Controls
  function setMuted(m){
    musicMuted = !!m;
    localStorage.setItem('kidsMusicMuted', m ? '1':'0');
    if (musicGain) musicGain.gain.value = m ? 0 : musicVol;
  }
  function setVolume(v){
    musicVol = Math.max(0, Math.min(1, v));
    localStorage.setItem('kidsMusicVol', musicVol.toString());
    if (!musicMuted && musicGain) musicGain.gain.value = musicVol;
  }
  function startIfNeeded(){
    if (started) return;
    ensureCtx();
    // resume context on iOS
    if (ctx.state === 'suspended') ctx.resume();
    started = true;
  }

  // UI binding (settings)
  document.addEventListener('DOMContentLoaded', ()=>{
    // add settings controls if not present
    let settings = document.getElementById('settingsPage') || document.body;
    if (!document.getElementById('audioSettings')){
      const wrap = document.createElement('div');
      wrap.id = 'audioSettings';
      wrap.className = 'card';
      wrap.style.marginTop = '12px';
      wrap.innerHTML = `
        <h3 style="margin-top:0">Audio</h3>
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <input type="checkbox" id="musicMute"> Mute music
        </label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:80px">Volume</span>
          <input type="range" id="musicVol" min="0" max="100" step="1">
          <span id="musicVolLabel"></span>
        </div>`;
      settings.appendChild(wrap);
    }
    const mute = document.getElementById('musicMute');
    const vol  = document.getElementById('musicVol');
    const out  = document.getElementById('musicVolLabel');
    if (mute){ mute.checked = musicMuted; mute.addEventListener('change', ()=> setMuted(mute.checked)); }
    if (vol){
      vol.value = Math.round(musicVol*100);
      out.textContent = vol.value + '%';
      vol.addEventListener('input', ()=>{ out.textContent = vol.value + '%'; setVolume(+vol.value/100); });
    }
  });

  // public API
  window.KPAudio = { startIfNeeded, click, setMuted, setVolume };
})();
