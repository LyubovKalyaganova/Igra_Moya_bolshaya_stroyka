(function (MBS) {
  var SPEECH_LANG = 'ru-RU';
  var FEMALE_NAMES = [
    'irina',
    'ирина',
    'milena',
    'elena',
    'елена',
    'anna',
    'анна',
    'alena',
    'алена',
    'ksenia',
    'ксения',
    'tatiana',
    'tatyana',
    'татьяна',
    'katya',
    'dasha',
    'female',
    'woman',
  ];
  var MUSIC_NOTES = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 261.63];

  function GameAudio(progress) {
    this.volume = typeof progress.soundVolume === 'number' ? progress.soundVolume : 0.8;
    this.muted = !!progress.soundMuted;
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.engineOscA = null;
    this.engineOscB = null;
    this.engineNoise = null;
    this.musicTimer = 0;
    this.musicNote = 0;
    this.voice = null;
    this.speaking = false;
    this.onChange = null;
    this._lastSpeakAt = 0;

    var self = this;
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', function () {
        self.voice = self._pickFemaleVoice();
      });
    }
  }

  GameAudio.prototype.ensure = function () {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return false;
    }
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.engineGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.musicGain.gain.value = 0.07;
      this.engineGain.gain.value = 0;
      this.sfxGain.connect(this.master);
      this.musicGain.connect(this.master);
      this.engineGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this._buildEngine();
      this._applyVolume();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  };

  GameAudio.prototype.setMuted = function (muted) {
    this.muted = muted;
    if (muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.speaking = false;
    }
    this._applyVolume();
    this._notify();
  };

  GameAudio.prototype.toggleMute = function () {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.speak('Звук включён.', { priority: 'low' });
    }
  };

  GameAudio.prototype.adjustVolume = function (delta) {
    if (this.muted && delta < 0) {
      return;
    }
    if (this.muted && delta > 0) {
      this.setMuted(false);
      this.play('click');
      return;
    }
    var next = MBS.clamp(this.volume + delta, 0, 1);
    this.volume = Math.round(next * 4) / 4;
    if (this.volume <= 0) {
      this.volume = 0;
      this.muted = true;
    }
    this._applyVolume();
    this._notify();
    this.play('click');
  };

  GameAudio.prototype.icon = function () {
    if (this.muted || this.volume <= 0) {
      return '🔇';
    }
    if (this.volume <= 0.25) {
      return '🔈';
    }
    if (this.volume <= 0.6) {
      return '🔉';
    }
    return '🔊';
  };

  GameAudio.prototype.update = function (dt, enginePower, vehicleKind, busy) {
    if (!this.ctx) {
      return;
    }
    this._updateEngine(enginePower, vehicleKind, busy);
    this._updateMusic(dt);
  };

  GameAudio.prototype.speak = function (text, options) {
    options = options || {};
    if (!text || this.muted || this.volume <= 0 || !window.speechSynthesis) {
      return;
    }

    var now = Date.now();
    if (options.throttleMs && now - this._lastSpeakAt < options.throttleMs) {
      return;
    }
    if (this.speaking && options.priority === 'low') {
      return;
    }

    this.ensure();
    if (!this.voice) {
      this.voice = this._pickFemaleVoice();
    }

    window.speechSynthesis.cancel();

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG;
    utterance.rate = 0.9;
    utterance.pitch = this.voice && /pavel|ivan|dmitry|male/i.test(this.voice.name) ? 1.38 : 1.18;
    utterance.volume = this.volume;
    if (this.voice) {
      utterance.voice = this.voice;
    }

    var self = this;
    this.speaking = true;
    this._lastSpeakAt = now;
    this._duckMusic(true);
    utterance.onend = function () {
      self.speaking = false;
      self._duckMusic(false);
    };
    utterance.onerror = function () {
      self.speaking = false;
      self._duckMusic(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  GameAudio.prototype.play = function (name) {
    if (!this.ensure() || this.muted || this.volume <= 0) {
      return;
    }
    if (name === 'dig') {
      this._thump(140, 0.22, 0.09);
      this._noiseBurst(0.18, 0.05, 900);
    } else if (name === 'load') {
      this._thump(110, 0.16, 0.07);
      this._noiseBurst(0.12, 0.04, 700);
    } else if (name === 'unload') {
      this._thump(90, 0.28, 0.08);
      this._sweep(180, 90, 0.35, 'triangle', 0.04);
    } else if (name === 'pour') {
      this._noiseBurst(0.45, 0.035, 1400);
      this._sweep(420, 220, 0.4, 'sine', 0.03);
    } else if (name === 'crane') {
      this._sweep(520, 340, 0.28, 'square', 0.03);
      this._beep(880, 0.08, 0.03, 0.18);
    } else if (name === 'ready') {
      this._beep(659, 0.1, 0.035, 0);
      this._beep(784, 0.12, 0.03, 0.12);
    } else if (name === 'click') {
      this._beep(740, 0.05, 0.025, 0);
    } else if (name === 'reward') {
      this._beep(523, 0.22, 0.05, 0);
      this._beep(659, 0.22, 0.05, 0.12);
      this._beep(784, 0.28, 0.055, 0.24);
    }
  };

  GameAudio.prototype._applyVolume = function () {
    if (!this.master) {
      return;
    }
    var level = this.muted ? 0 : this.volume;
    this.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.04);
  };

  GameAudio.prototype._duckMusic = function (duck) {
    if (!this.musicGain || !this.ctx) {
      return;
    }
    this.musicGain.gain.setTargetAtTime(duck ? 0.02 : 0.07, this.ctx.currentTime, 0.12);
  };

  GameAudio.prototype._notify = function () {
    if (this.onChange) {
      this.onChange({ volume: this.volume, muted: this.muted });
    }
  };

  GameAudio.prototype._pickFemaleVoice = function () {
    if (!window.speechSynthesis) {
      return null;
    }
    var voices = window.speechSynthesis.getVoices() || [];
    var russian = [];
    var i;
    for (i = 0; i < voices.length; i += 1) {
      if (/ru/i.test(voices[i].lang)) {
        russian.push(voices[i]);
      }
    }
    var pool = russian.length ? russian : voices;
    for (i = 0; i < pool.length; i += 1) {
      var name = (pool[i].name || '').toLowerCase();
      for (var n = 0; n < FEMALE_NAMES.length; n += 1) {
        if (name.indexOf(FEMALE_NAMES[n]) !== -1) {
          return pool[i];
        }
      }
    }
    return russian[0] || voices[0] || null;
  };

  GameAudio.prototype._buildEngine = function () {
    var ctx = this.ctx;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 280;
    this.engineFilter.connect(this.engineGain);

    this.engineOscA = ctx.createOscillator();
    this.engineOscA.type = 'sawtooth';
    this.engineOscA.frequency.value = 72;
    var oscGainA = ctx.createGain();
    oscGainA.gain.value = 0.18;
    this.engineOscA.connect(oscGainA);
    oscGainA.connect(this.engineFilter);

    this.engineOscB = ctx.createOscillator();
    this.engineOscB.type = 'triangle';
    this.engineOscB.frequency.value = 96;
    var oscGainB = ctx.createGain();
    oscGainB.gain.value = 0.12;
    this.engineOscB.connect(oscGainB);
    oscGainB.connect(this.engineFilter);

    var noise = ctx.createBufferSource();
    var buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    noise.loop = true;
    var noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.04;
    noise.connect(noiseGain);
    noiseGain.connect(this.engineFilter);

    this.engineOscA.start();
    this.engineOscB.start();
    noise.start();
    this.engineNoise = noise;
  };

  GameAudio.prototype._updateEngine = function (power, kind, busy) {
    var now = this.ctx.currentTime;
    var base = 70;
    if (kind === 'dumpTruck') {
      base = 88;
    } else if (kind === 'mixer') {
      base = 78;
    } else if (kind === 'crane') {
      base = 62;
    }
    var moving = Math.max(0, Math.min(1, power));
    var extra = busy ? 0.18 : 0;
    var target = moving > 0.08 || busy ? 0.09 + moving * 0.16 + extra : 0;
    this.engineGain.gain.setTargetAtTime(target, now, 0.08);
    this.engineOscA.frequency.setTargetAtTime(base + moving * 28, now, 0.08);
    this.engineOscB.frequency.setTargetAtTime(base * 1.35 + moving * 36, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(240 + moving * 180, now, 0.1);
  };

  GameAudio.prototype._updateMusic = function (dt) {
    this.musicTimer += dt;
    if (this.musicTimer < 1.15) {
      return;
    }
    this.musicTimer = 0;
    var freq = MUSIC_NOTES[this.musicNote % MUSIC_NOTES.length];
    this.musicNote += 1;
    this._beep(freq, 0.7, 0.045, 0, this.musicGain);
    this._beep(freq * 1.5, 0.55, 0.02, 0.05, this.musicGain);
  };

  GameAudio.prototype._beep = function (freq, duration, gainValue, delay, dest) {
    var ctx = this.ctx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    var start = ctx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(dest || this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  GameAudio.prototype._sweep = function (from, to, duration, type, gainValue) {
    var ctx = this.ctx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    var start = ctx.currentTime;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  GameAudio.prototype._thump = function (freq, duration, gainValue) {
    this._sweep(freq, freq * 0.45, duration, 'sine', gainValue);
  };

  GameAudio.prototype._noiseBurst = function (duration, gainValue, cutoff) {
    var ctx = this.ctx;
    var buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    var gain = ctx.createGain();
    var start = ctx.currentTime;
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(start);
    src.stop(start + duration + 0.02);
  };

  MBS.GameAudio = GameAudio;
})(window.MBS = window.MBS || {});
