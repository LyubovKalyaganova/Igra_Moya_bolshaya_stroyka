(function (MBS) {
  var SPEECH_LANG = 'ru-RU';
  var FEMALE_NAMES = [
    'svetlana',
    'dariya',
    'daria',
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
    'oksana',
    'jane',
    'alisa',
    'katya',
    'dasha',
    'female',
    'woman',
  ];
  var MUSIC_NOTES = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 261.63];
  var NUMBER_WORDS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];
  var EDGE_TTS_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  var EDGE_TTS_VOICE = 'ru-RU-SvetlanaNeural';

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
    this._speechToken = 0;
    this._speechQueue = [];
    this._speechAudio = null;
    this._speechSocket = null;
    this._cloudEngine = null;

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
    if (muted) {
      this._stopSpeech();
    }
    this._applyVolume();
    this._notify();
  };

  GameAudio.prototype.toggleMute = function () {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.speak('Ура, звук включён!', { priority: 'low' });
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
    if (!text || this.muted || this.volume <= 0) {
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

    this._stopSpeech();
    this._speechToken += 1;
    this._speechQueue = this._splitPhrases(this._friendlySpeech(text));
    this.speaking = true;
    this._lastSpeakAt = now;
    this._duckMusic(true);
    this._speakNext(this._speechToken);
  };

  GameAudio.prototype._friendlySpeech = function (text) {
    var spoken = String(text).replace(/\s+/g, ' ').trim();
    var lower = spoken.toLowerCase();
    var countMatch = lower.match(
      /(?:ковш|загружено|участок|блок|часть)?\s*(\d+|один|два|три|четыре|пять|шесть|семь|восемь|девять|десять)\s+из\s+(?:\d+|один|два|три|четыре|пять|шесть|семь|восемь|девять|десять)/
    );
    if (countMatch) {
      var raw = countMatch[1];
      var count = parseInt(raw, 10);
      if (!isNaN(count)) {
        return NUMBER_WORDS[count] || raw;
      }
      return raw;
    }
    return spoken.replace(/\d+/g, function (match) {
      var n = parseInt(match, 10);
      return NUMBER_WORDS[n] || match;
    });
  };

  GameAudio.prototype.speakCount = function (n) {
    this.speak(NUMBER_WORDS[n] || String(n));
  };

  GameAudio.prototype._splitPhrases = function (text) {
    var parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    var phrases = [];
    var i;
    for (i = 0; i < parts.length; i += 1) {
      var part = parts[i].trim();
      if (!part) {
        continue;
      }
      if (part.length <= 140) {
        phrases.push(part);
      } else {
        var chunks = part.split(/,\s+/);
        var buf = '';
        var c;
        for (c = 0; c < chunks.length; c += 1) {
          var next = buf ? buf + ', ' + chunks[c] : chunks[c];
          if (next.length > 140 && buf) {
            phrases.push(buf);
            buf = chunks[c];
          } else {
            buf = next;
          }
        }
        if (buf) {
          phrases.push(buf);
        }
      }
    }
    return phrases.length ? phrases : [text];
  };

  GameAudio.prototype._stopSpeech = function () {
    this._speechToken += 1;
    this._speechQueue = [];
    this.speaking = false;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (this._speechAudio) {
      this._speechAudio.onended = null;
      this._speechAudio.onerror = null;
      this._speechAudio.pause();
      this._speechAudio.removeAttribute('src');
      this._speechAudio.load();
      this._speechAudio = null;
    }
    if (this._speechSocket) {
      try {
        this._speechSocket.close();
      } catch (err) {}
      this._speechSocket = null;
    }
    this._duckMusic(false);
  };

  GameAudio.prototype._hasNaturalVoice = function () {
    if (!this.voice) {
      return false;
    }
    var name = (this.voice.name || '').toLowerCase();
    return /natural|neural|online|premium|enhanced|google|yandex|svetlana|dariya/.test(name);
  };

  GameAudio.prototype._speakNext = function (token) {
    if (token !== this._speechToken) {
      return;
    }
    if (!this._speechQueue.length) {
      this.speaking = false;
      this._duckMusic(false);
      return;
    }

    var phrase = this._speechQueue.shift();
    var excited = /[!]|(ура|супер|молодец|умница|здорово|давай)/i.test(phrase);
    if (this._hasNaturalVoice()) {
      this._speakSystem(phrase, token, excited);
      return;
    }
    this._speakCloud(phrase, token, excited);
  };

  GameAudio.prototype._speakCloud = function (phrase, token, excited) {
    var self = this;
    if (this._cloudEngine === 'google') {
      this._speakGoogle(phrase, token, excited, function (okGoogle) {
        if (okGoogle || token !== self._speechToken) {
          return;
        }
        self._cloudEngine = 'system';
        self._speakSystem(phrase, token, excited);
      });
      return;
    }
    if (this._cloudEngine === 'system') {
      this._speakSystem(phrase, token, excited);
      return;
    }

    this._speakEdge(phrase, token, excited, function (ok) {
      if (token !== self._speechToken) {
        return;
      }
      if (ok) {
        self._cloudEngine = 'edge';
        return;
      }
      self._speakGoogle(phrase, token, excited, function (okGoogle) {
        if (token !== self._speechToken) {
          return;
        }
        if (okGoogle) {
          self._cloudEngine = 'google';
          return;
        }
        self._cloudEngine = 'system';
        self._speakSystem(phrase, token, excited);
      });
    });
  };

  GameAudio.prototype._playSpeechAudio = function (src, token, excited, onStart, onFail) {
    var self = this;
    var audio = new Audio();
    audio.preload = 'auto';
    audio.referrerPolicy = 'no-referrer';
    audio.volume = Math.max(0.15, this.volume);
    audio.playbackRate = excited ? 1.06 : 1.0;
    this._speechAudio = audio;

    var failed = false;
    var started = false;
    var timer = window.setTimeout(function () {
      if (failed || started || token !== self._speechToken) {
        return;
      }
      failed = true;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      if (self._speechAudio === audio) {
        self._speechAudio = null;
      }
      if (onFail) {
        onFail();
      }
    }, 6000);

    audio.onplaying = function () {
      if (failed || token !== self._speechToken) {
        return;
      }
      started = true;
      window.clearTimeout(timer);
      if (onStart) {
        onStart();
      }
    };
    audio.onended = function () {
      if (failed || token !== self._speechToken) {
        return;
      }
      window.clearTimeout(timer);
      window.setTimeout(function () {
        self._speakNext(token);
      }, excited ? 70 : 110);
    };
    audio.onerror = function () {
      if (failed || started || token !== self._speechToken) {
        return;
      }
      failed = true;
      window.clearTimeout(timer);
      if (self._speechAudio === audio) {
        self._speechAudio = null;
      }
      if (onFail) {
        onFail();
      }
    };
    audio.src = src;
    var playResult = audio.play();
    if (playResult && playResult.catch) {
      playResult.catch(function () {
        if (failed || started || token !== self._speechToken) {
          return;
        }
        failed = true;
        window.clearTimeout(timer);
        if (self._speechAudio === audio) {
          self._speechAudio = null;
        }
        if (onFail) {
          onFail();
        }
      });
    }
  };

  GameAudio.prototype._speakGoogle = function (phrase, token, excited, done) {
    var q = encodeURIComponent(phrase);
    var url =
      'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=ru&q=' + q;
    this._playSpeechAudio(
      url,
      token,
      excited,
      function () {
        done(true);
      },
      function () {
        done(false);
      }
    );
  };

  GameAudio.prototype._escapeXml = function (text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  GameAudio.prototype._sha256Hex = function (text, done) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      done(null);
      return;
    }
    window.crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(text))
      .then(function (buf) {
        var bytes = new Uint8Array(buf);
        var hex = '';
        var i;
        for (i = 0; i < bytes.length; i += 1) {
          hex += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
        }
        done(hex.toUpperCase());
      })
      .catch(function () {
        done(null);
      });
  };

  GameAudio.prototype._edgeGec = function (done) {
    var ticks = Date.now() / 1000 + 11644473600;
    ticks -= ticks % 300;
    ticks = Math.floor(ticks * 1e7);
    this._sha256Hex(String(ticks) + EDGE_TTS_TOKEN, done);
  };

  GameAudio.prototype._speakEdge = function (phrase, token, excited, done) {
    var self = this;
    if (!window.WebSocket || !window.crypto || !window.crypto.subtle) {
      done(false);
      return;
    }

    this._edgeGec(function (gec) {
      if (!gec || token !== self._speechToken) {
        done(false);
        return;
      }

      var requestId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      });
      var url =
        'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1' +
        '?TrustedClientToken=' +
        EDGE_TTS_TOKEN +
        '&ConnectionId=' +
        requestId +
        '&Sec-MS-GEC=' +
        gec +
        '&Sec-MS-GEC-Version=' +
        encodeURIComponent('1-132.0.2957.115');

      var socket;
      try {
        socket = new WebSocket(url);
      } catch (err) {
        done(false);
        return;
      }

      self._speechSocket = socket;
      socket.binaryType = 'arraybuffer';
      var chunks = [];
      var finished = false;

      function fail() {
        if (finished) {
          return;
        }
        finished = true;
        try {
          socket.close();
        } catch (err) {}
        if (self._speechSocket === socket) {
          self._speechSocket = null;
        }
        done(false);
      }

      var timer = window.setTimeout(fail, 3500);

      socket.onerror = fail;
      socket.onopen = function () {
        if (token !== self._speechToken) {
          fail();
          return;
        }
        var stamp = new Date().toISOString();
        var config =
          'Path: speech.config\r\nX-RequestId: ' +
          requestId +
          '\r\nX-Timestamp: ' +
          stamp +
          '\r\nContent-Type: application/json; charset=utf-8\r\n\r\n' +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}';
        var rate = excited ? '+10%' : '+4%';
        var pitch = excited ? '+12Hz' : '+6Hz';
        var ssml =
          "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='ru-RU'>" +
          "<voice name='" +
          EDGE_TTS_VOICE +
          "'><mstts:express-as style='cheerful'><prosody rate='" +
          rate +
          "' pitch='" +
          pitch +
          "'>" +
          self._escapeXml(phrase) +
          '</prosody></mstts:express-as></voice></speak>';
        var ssmlMsg =
          'Path: ssml\r\nX-RequestId: ' +
          requestId +
          '\r\nX-Timestamp: ' +
          stamp +
          '\r\nContent-Type: application/ssml+xml\r\n\r\n' +
          ssml;
        try {
          socket.send(config);
          socket.send(ssmlMsg);
        } catch (err) {
          fail();
        }
      };

      socket.onmessage = function (event) {
        if (token !== self._speechToken) {
          fail();
          return;
        }
        if (typeof event.data === 'string') {
          if (event.data.indexOf('Path:turn.end') !== -1) {
            window.clearTimeout(timer);
            finished = true;
            try {
              socket.close();
            } catch (err) {}
            if (self._speechSocket === socket) {
              self._speechSocket = null;
            }
            if (!chunks.length) {
              done(false);
              return;
            }
            var blob = new Blob(chunks, { type: 'audio/mpeg' });
            var src = URL.createObjectURL(blob);
            self._playSpeechAudio(
              src,
              token,
              excited,
              function () {
                done(true);
              },
              function () {
                URL.revokeObjectURL(src);
                done(false);
              }
            );
            var audio = self._speechAudio;
            if (audio) {
              audio.addEventListener('ended', function () {
                URL.revokeObjectURL(src);
              });
            } else {
              URL.revokeObjectURL(src);
              done(false);
            }
          }
          return;
        }

        var buffer = event.data;
        if (!(buffer instanceof ArrayBuffer)) {
          return;
        }
        if (buffer.byteLength < 2) {
          return;
        }
        var headerLength = new DataView(buffer).getUint16(0);
        if (buffer.byteLength > headerLength + 2) {
          chunks.push(buffer.slice(headerLength + 2));
        }
      };
    });
  };

  GameAudio.prototype._speakSystem = function (phrase, token, excited) {
    if (!window.speechSynthesis) {
      this.speaking = false;
      this._duckMusic(false);
      return;
    }

    var utterance = new SpeechSynthesisUtterance(phrase);
    var male = this.voice && /pavel|ivan|dmitry|male/i.test(this.voice.name);
    utterance.lang = SPEECH_LANG;
    utterance.rate = excited ? 1.04 : 0.98;
    utterance.pitch = male ? (excited ? 1.42 : 1.32) : excited ? 1.32 : 1.22;
    utterance.volume = this.volume;
    if (this.voice) {
      utterance.voice = this.voice;
    }

    var self = this;
    utterance.onend = function () {
      window.setTimeout(function () {
        self._speakNext(token);
      }, excited ? 70 : 110);
    };
    utterance.onerror = function () {
      if (token !== self._speechToken) {
        return;
      }
      self.speaking = false;
      self._speechQueue = [];
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
    var level = this.muted ? 0 : this.volume;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.04);
    }
    if (this._speechAudio) {
      this._speechAudio.volume = level;
    }
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

  GameAudio.prototype._scoreVoice = function (voice) {
    var name = (voice.name || '').toLowerCase();
    var lang = (voice.lang || '').toLowerCase();
    var score = 0;
    if (/^ru/.test(lang)) {
      score += 60;
    }
    if (/natural|neural|online|premium|enhanced|google|yandex/.test(name)) {
      score += 45;
    }
    if (/svetlana|dariya|daria|milena|elena|елена|anna|анна|ksenia|ксения|alena|алена|oksana|jane|alisa/.test(name)) {
      score += 28;
    }
    var n;
    for (n = 0; n < FEMALE_NAMES.length; n += 1) {
      if (name.indexOf(FEMALE_NAMES[n]) !== -1) {
        score += 12;
        break;
      }
    }
    if (/female|woman/.test(name)) {
      score += 10;
    }
    if (/desktop|compact|espeak|irina|ирина/.test(name)) {
      score -= 40;
    }
    if (/pavel|ivan|dmitry|male/.test(name)) {
      score -= 50;
    }
    return score;
  };

  GameAudio.prototype._pickFemaleVoice = function () {
    if (!window.speechSynthesis) {
      return null;
    }
    var voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) {
      return null;
    }
    var best = voices[0];
    var bestScore = this._scoreVoice(best);
    var i;
    for (i = 1; i < voices.length; i += 1) {
      var score = this._scoreVoice(voices[i]);
      if (score > bestScore) {
        best = voices[i];
        bestScore = score;
      }
    }
    return best;
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
