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
    'alisa',
    'алиса',
    'ksenia',
    'ксения',
    'tatiana',
    'tatyana',
    'татьяна',
    'oksana',
    'jane',
    'katya',
    'dasha',
    'female',
    'woman',
  ];
  var EDM_LEAD = [
    523.25, 0, 659.25, 783.99, 0, 880.0, 783.99, 0, 659.25, 0, 523.25, 659.25, 698.46, 0, 783.99, 659.25,
  ];
  var EDM_BASS = [130.81, 0, 0, 130.81, 196.0, 0, 164.81, 0, 146.83, 0, 130.81, 0, 174.61, 0, 196.0, 174.61];
  var NUMBER_WORDS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];
  var EDGE_TTS_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  var EDGE_TTS_VOICE = 'ru-RU-DariyaNeural';

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
    this.engineOscC = null;
    this.engineNoiseGain = null;
    this._engineKind = '';
    this.musicTimer = 0;
    this.musicStep = 0;
    this.birdTimer = 1.6;
    this.voice = null;
    this.speaking = false;
    this.onChange = null;
    this._lastSpeakAt = 0;
    this._speechToken = 0;
    this._speechQueue = [];
    this._speechAudio = null;
    this._speechSocket = null;
    this._cloudEngine = null;
    this._skipYandex = false;
    this._skipEdge = false;
    this._skipGoogle = false;

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
      this.musicGain.gain.value = 0.36;
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
    this._updateBirds(dt);
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
    if (this.speaking && options.priority === 'low' && !options.queue) {
      return;
    }

    this.ensure();
    if (!this.voice) {
      this.voice = this._pickFemaleVoice();
    }

    var phrases = this._splitPhrases(this._friendlySpeech(text));
    if (options.queue && this.speaking) {
      this._speechQueue = this._speechQueue.concat(phrases);
      this._lastSpeakAt = now;
      return;
    }

    this._stopSpeech();
    this._speechToken += 1;
    this._speechQueue = phrases;
    this.speaking = true;
    this._lastSpeakAt = now;
    this._duckMusic(true);
    this._speakNext(this._speechToken);
  };

  GameAudio.prototype._spokenPlain = function (phrase) {
    return String(phrase)
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s+и нажми/gi, ', и нажми')
      .replace(/\s+а потом/gi, ', а потом')
      .replace(/\s+а затем/gi, ', а затем')
      .replace(/\s+(Теперь|теперь)\s+/g, '. $1 ')
      .replace(/!\s+/g, '! ')
      .replace(/\?\s+/g, '? ')
      .replace(/\.\s+/g, '. ');
  };

  GameAudio.prototype._ssmlInner = function (phrase) {
    var text = this._escapeXml(this._spokenPlain(phrase));
    text = text.replace(/(Ура|Вау|Класс|Супер|Молодец|умница)/gi, "<emphasis level='moderate'>$1</emphasis>");
    text = text.replace(/!\s+/g, '! <break time="340ms"/> ');
    text = text.replace(/\?\s+/g, '? <break time="400ms"/> ');
    text = text.replace(/\.\s+/g, '. <break time="480ms"/> ');
    text = text.replace(/,\s+/g, ', <break time="220ms"/> ');
    text = text.replace(/\s+—\s+/g, ' <break time="260ms"/> ');
    text = text.replace(/:\s+/g, ': <break time="240ms"/> ');
    return text;
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
    var spoken = String(text).replace(/\s+/g, ' ').trim();
    if (spoken.length <= 180) {
      return [spoken];
    }
    var parts = spoken.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [spoken];
    var phrases = [];
    var buf = '';
    var i;
    for (i = 0; i < parts.length; i += 1) {
      var part = parts[i].trim();
      if (!part) {
        continue;
      }
      var next = buf ? buf + ' ' + part : part;
      if (next.length > 180 && buf) {
        phrases.push(buf);
        buf = part;
      } else {
        buf = next;
      }
    }
    if (buf) {
      phrases.push(buf);
    }
    return phrases.length ? phrases : [spoken];
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

  GameAudio.prototype._isRaspyVoice = function (voice) {
    if (!voice) {
      return true;
    }
    var name = (voice.name || '').toLowerCase();
    return /irina|ирина|desktop|compact|espeak/.test(name);
  };

  GameAudio.prototype._hasAliceVoice = function () {
    if (!this.voice || this._isRaspyVoice(this.voice)) {
      return false;
    }
    var name = (this.voice.name || '').toLowerCase();
    return /alisa|алиса|alena|алена|yandex|oksana|оксана|alyss/.test(name);
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
    if (this._hasAliceVoice()) {
      this._speakSystem(phrase, token, excited);
      return;
    }
    this._speakCloud(phrase, token, excited);
  };

  GameAudio.prototype._speakCloud = function (phrase, token, excited) {
    var self = this;

    function useSystem() {
      self._speakSystem(phrase, token, excited);
    }

    function useGoogle() {
      if (self._skipGoogle) {
        useSystem();
        return;
      }
      self._speakGoogle(phrase, token, excited, function (okGoogle) {
        if (okGoogle || token !== self._speechToken) {
          return;
        }
        self._skipGoogle = true;
        self._cloudEngine = null;
        useSystem();
      });
    }

    function useEdge() {
      if (self._skipEdge) {
        useGoogle();
        return;
      }
      self._speakEdge(phrase, token, excited, function (ok) {
        if (token !== self._speechToken) {
          return;
        }
        if (ok) {
          self._cloudEngine = 'edge';
          return;
        }
        self._skipEdge = true;
        useGoogle();
      });
    }

    if (this._cloudEngine === 'google' && !this._skipGoogle) {
      useGoogle();
      return;
    }
    if (this._cloudEngine === 'edge' && !this._skipEdge) {
      useEdge();
      return;
    }
    if (this._cloudEngine === 'yandex' && !this._skipYandex) {
      this._speakYandex(phrase, token, excited, function (ok) {
        if (token !== self._speechToken) {
          return;
        }
        if (ok) {
          return;
        }
        self._skipYandex = true;
        self._cloudEngine = null;
        useEdge();
      });
      return;
    }

    useEdge();
  };

  GameAudio.prototype._playSpeechAudio = function (src, token, excited, onStart, onFail, timeoutMs) {
    var self = this;
    var audio = new Audio();
    audio.preload = 'auto';
    audio.referrerPolicy = 'no-referrer';
    audio.volume = Math.max(0.15, this.volume);
    audio.playbackRate = 1;
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
    }, timeoutMs || 6000);

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
      self._speakNext(token);
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

  GameAudio.prototype._speakYandex = function (phrase, token, excited, done) {
    var q = encodeURIComponent(this._spokenPlain(phrase));
    var url =
      'https://tts.voicetech.yandex.net/tts?format=mp3&quality=hi&platform=web&application=translate&lang=ru_RU&speaker=alyss&emotion=good&speed=0.95&text=' +
      q;
    this._playSpeechAudio(
      url,
      token,
      excited,
      function () {
        done(true);
      },
      function () {
        done(false);
      },
      900
    );
  };

  GameAudio.prototype._speakGoogle = function (phrase, token, excited, done) {
    var q = encodeURIComponent(this._spokenPlain(phrase));
    var url =
      'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ru&q=' + q;
    this._playSpeechAudio(
      url,
      token,
      excited,
      function () {
        done(true);
      },
      function () {
        done(false);
      },
      2500
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
          '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-96kbitrate-mono-mp3"}}}}';
        var rate = excited ? '+6%' : '-4%';
        var pitch = excited ? '+5%' : '+2%';
        var inner =
          "<prosody rate='" +
          rate +
          "' pitch='" +
          pitch +
          "'>" +
          self._ssmlInner(phrase) +
          '</prosody>';
        if (excited) {
          inner = "<mstts:express-as style='cheerful'>" + inner + '</mstts:express-as>';
        }
        var ssml =
          "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='ru-RU'>" +
          "<voice name='" +
          EDGE_TTS_VOICE +
          "'>" +
          inner +
          '</voice></speak>';
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

    var utterance = new SpeechSynthesisUtterance(this._spokenPlain(phrase));
    var raspy = this._isRaspyVoice(this.voice);
    utterance.lang = SPEECH_LANG;
    utterance.rate = raspy ? 0.96 : excited ? 1.04 : 0.98;
    utterance.pitch = raspy ? 1.04 : excited ? 1.14 : 1.08;
    utterance.volume = this.volume;
    if (this.voice) {
      utterance.voice = this.voice;
    }

    var self = this;
    utterance.onend = function () {
      self._speakNext(token);
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
    this.musicGain.gain.setTargetAtTime(duck ? 0.12 : 0.36, this.ctx.currentTime, 0.12);
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
    if (/yandex|alisa|алиса|alena|алена|alyss/.test(name)) {
      score += 80;
    }
    if (/dariya|daria/.test(name)) {
      score += 36;
    }
    if (/natural|neural|online|premium|enhanced|google/.test(name)) {
      score += 45;
    }
    if (/svetlana|milena|elena|елена|anna|анна|ksenia|ксения|oksana|jane/.test(name)) {
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
      score -= 120;
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
    oscGainA.gain.value = 0.16;
    this.engineOscA.connect(oscGainA);
    oscGainA.connect(this.engineFilter);
    this.engineGainA = oscGainA;

    this.engineOscB = ctx.createOscillator();
    this.engineOscB.type = 'triangle';
    this.engineOscB.frequency.value = 96;
    var oscGainB = ctx.createGain();
    oscGainB.gain.value = 0.1;
    this.engineOscB.connect(oscGainB);
    oscGainB.connect(this.engineFilter);
    this.engineGainB = oscGainB;

    this.engineOscC = ctx.createOscillator();
    this.engineOscC.type = 'square';
    this.engineOscC.frequency.value = 48;
    var oscGainC = ctx.createGain();
    oscGainC.gain.value = 0.04;
    this.engineOscC.connect(oscGainC);
    oscGainC.connect(this.engineFilter);
    this.engineGainC = oscGainC;

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
    this.engineNoiseGain = noiseGain;

    this.engineOscA.start();
    this.engineOscB.start();
    this.engineOscC.start();
    noise.start();
    this.engineNoise = noise;
  };

  GameAudio.prototype._updateEngine = function (power, kind, busy) {
    var now = this.ctx.currentTime;
    var moving = Math.max(0, Math.min(1, power));
    var extra = busy ? 0.16 : 0;
    var target = moving > 0.08 || busy ? 0.08 + moving * 0.18 + extra : 0;
    this.engineGain.gain.setTargetAtTime(target, now, 0.08);

    var base = 62;
    var high = 90;
    var whine = 140;
    var filter = 240;
    var noise = 0.035;
    if (kind === 'dumpTruck') {
      base = 38;
      high = 56;
      whine = 76;
      filter = 170;
      noise = 0.08;
    } else if (kind === 'mixer') {
      base = 84;
      high = 168;
      whine = 252;
      filter = 420;
      noise = 0.03;
    } else if (kind === 'crane') {
      base = 118;
      high = 240;
      whine = 360;
      filter = 980;
      noise = 0.02;
    }
    if (kind !== this._engineKind) {
      this._engineKind = kind;
      if (kind === 'dumpTruck') {
        this.engineOscA.type = 'sawtooth';
        this.engineOscB.type = 'square';
        this.engineOscC.type = 'sawtooth';
      } else if (kind === 'mixer') {
        this.engineOscA.type = 'triangle';
        this.engineOscB.type = 'sine';
        this.engineOscC.type = 'square';
      } else if (kind === 'crane') {
        this.engineOscA.type = 'sine';
        this.engineOscB.type = 'triangle';
        this.engineOscC.type = 'sine';
      } else {
        this.engineOscA.type = 'sawtooth';
        this.engineOscB.type = 'triangle';
        this.engineOscC.type = 'sawtooth';
      }
    }

    this.engineOscA.frequency.setTargetAtTime(base + moving * 22, now, 0.08);
    this.engineOscB.frequency.setTargetAtTime(high + moving * 28, now, 0.08);
    this.engineOscC.frequency.setTargetAtTime(whine + moving * 40, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filter + moving * 160, now, 0.1);
    if (this.engineNoiseGain) {
      this.engineNoiseGain.gain.setTargetAtTime(noise + extra * 0.04, now, 0.1);
    }
  };

  GameAudio.prototype._updateMusic = function (dt) {
    this.musicTimer += dt;
    if (this.musicTimer < 0.117) {
      return;
    }
    this.musicTimer = 0;
    var step = this.musicStep % 16;
    this.musicStep += 1;
    var lead = EDM_LEAD[step];
    var bass = EDM_BASS[step];
    if (step % 4 === 0) {
      this._beep(58, 0.14, 0.16, 0, this.musicGain, 'sine');
    }
    if (step === 4 || step === 12) {
      this._noiseBurst(0.08, 0.06, 1800, this.musicGain);
    }
    if (step % 2 === 1) {
      this._noiseBurst(0.03, 0.028, 9000, this.musicGain);
    }
    if (bass) {
      this._beep(bass, 0.2, 0.12, 0, this.musicGain, 'sine');
      this._beep(bass * 2, 0.12, 0.035, 0, this.musicGain, 'triangle');
    }
    if (lead) {
      this._beep(lead, 0.16, 0.1, 0, this.musicGain, 'sawtooth');
      this._beep(lead * 2, 0.1, 0.03, 0.04, this.musicGain, 'sine');
    }
  };

  GameAudio.prototype._updateBirds = function (dt) {
    this.birdTimer -= dt;
    if (this.birdTimer > 0) {
      return;
    }
    this.birdTimer = 1.7 + Math.random() * 2.8;
    var chirp = 1800 + Math.random() * 1400;
    this._beep(chirp, 0.1, 0.055, 0, this.musicGain);
    this._beep(chirp * 1.18, 0.09, 0.04, 0.08, this.musicGain);
  };

  GameAudio.prototype._beep = function (freq, duration, gainValue, delay, dest, type) {
    var ctx = this.ctx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var start = ctx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
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

  GameAudio.prototype._noiseBurst = function (duration, gainValue, cutoff, dest) {
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
    gain.connect(dest || this.sfxGain);
    src.start(start);
    src.stop(start + duration + 0.02);
  };

  MBS.GameAudio = GameAudio;
})(window.MBS = window.MBS || {});
