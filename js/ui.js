(function (MBS) {
  function GameUI(root) {
    this.root = root;
    this.startScreen = root.querySelector('#start-screen');
    this.playButton = root.querySelector('#btn-play');
    this.mathButton = root.querySelector('#btn-math');
    this.hudMathButton = root.querySelector('#btn-hud-math');
    this.hintEl = root.querySelector('#hint');
    this.starsEl = root.querySelector('#stars');
    this.countEl = root.querySelector('#count-pop');
    this.digButton = root.querySelector('#btn-dig');
    this.actionIcon = root.querySelector('.dig-icon');
    this.actionLabel = root.querySelector('.action-label');
    this.moveButtons = root.querySelectorAll('[data-move]');
    this.rewardScreen = root.querySelector('#reward-screen');
    this.rewardBadge = root.querySelector('#reward-screen .reward-badge');
    this.rewardStars = root.querySelector('#reward-stars');
    this.rewardTitle = root.querySelector('#reward-title');
    this.rewardText = root.querySelector('#reward-text');
    this.nextButton = root.querySelector('#btn-next');
    this.vehicleBar = root.querySelector('#vehicle-bar');
    this.vehicleButtons = root.querySelectorAll('[data-vehicle]');
    this.muteButton = root.querySelector('#btn-mute');
    this.volDownButton = root.querySelector('#btn-vol-down');
    this.volUpButton = root.querySelector('#btn-vol-up');
    this.mathScreen = root.querySelector('#math-screen');
    this.mathProgress = root.querySelector('#math-progress');
    this.mathPrompt = root.querySelector('#math-prompt');
    this.mathVisual = root.querySelector('#math-visual');
    this.mathChoices = root.querySelector('#math-choices');
    this.mathLocked = false;
    this.audio = null;
    this._cheerIndex = 0;
    this.onPlay = null;
    this.onNext = null;
    this.onDigPress = null;
    this.onDigRelease = null;
    this.onMoveChange = null;
    this.onVehiclePick = null;
    this.onMathPlay = null;
    this.onHudMath = null;
    this.onMathAnswer = null;
  }

  GameUI.prototype.bind = function () {
    var self = this;

    this.playButton.addEventListener('click', function () {
      self.hideStart();
      if (self.onPlay) {
        self.onPlay();
      }
    });

    if (this.mathButton) {
      this.mathButton.addEventListener('click', function () {
        self.hideStart();
        if (self.onMathPlay) {
          self.onMathPlay();
        }
      });
    }

    if (this.hudMathButton) {
      this.hudMathButton.addEventListener('click', function () {
        if (self.onHudMath) {
          self.onHudMath();
        }
      });
    }

    this.nextButton.addEventListener('click', function () {
      self.hideReward();
      if (self.onNext) {
        self.onNext();
      }
    });

    this.muteButton.addEventListener('click', function () {
      if (self.audio) {
        self.audio.ensure();
        self.audio.toggleMute();
        self.refreshSoundButtons();
      }
    });
    this.volDownButton.addEventListener('click', function () {
      if (self.audio) {
        self.audio.ensure();
        self.audio.adjustVolume(-0.25);
        self.refreshSoundButtons();
      }
    });
    this.volUpButton.addEventListener('click', function () {
      if (self.audio) {
        self.audio.ensure();
        self.audio.adjustVolume(0.25);
        self.refreshSoundButtons();
      }
    });

    this.moveButtons.forEach(function (button) {
      var direction = button.dataset.move;
      var start = function (event) {
        event.preventDefault();
        button.classList.add('is-down');
        if (self.onMoveChange) {
          self.onMoveChange(direction, true);
        }
      };
      var end = function (event) {
        event.preventDefault();
        button.classList.remove('is-down');
        if (self.onMoveChange) {
          self.onMoveChange(direction, false);
        }
      };

      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', end);
      button.addEventListener('pointerleave', end);
      button.addEventListener('pointercancel', end);
    });

    var digStart = function (event) {
      event.preventDefault();
      self.digButton.classList.add('is-down');
      if (self.onDigPress) {
        self.onDigPress();
      }
    };
    var digEnd = function (event) {
      event.preventDefault();
      self.digButton.classList.remove('is-down');
      if (self.onDigRelease) {
        self.onDigRelease();
      }
    };

    this.digButton.addEventListener('pointerdown', digStart);
    this.digButton.addEventListener('pointerup', digEnd);
    this.digButton.addEventListener('pointerleave', digEnd);
    this.digButton.addEventListener('pointercancel', digEnd);

    this.vehicleButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (self.onVehiclePick) {
          self.onVehiclePick(button.getAttribute('data-vehicle'));
        }
      });
    });
  };

  GameUI.prototype.refreshSoundButtons = function () {
    if (!this.audio) {
      return;
    }
    this.muteButton.textContent = this.audio.icon();
    this.muteButton.classList.toggle('is-muted', this.audio.muted || this.audio.volume <= 0);
    this.muteButton.setAttribute('aria-label', this.audio.muted ? 'Включить звук' : 'Выключить звук');
  };

  GameUI.prototype.hideStart = function () {
    this.startScreen.classList.add('is-hidden');
    this.startScreen.setAttribute('hidden', '');
    this.startScreen.setAttribute('aria-hidden', 'true');
    this.showHudMath();
  };

  GameUI.prototype.showStart = function () {
    this.hideMath();
    this.hideVehicleBar();
    this.hideHudMath();
    this.startScreen.classList.remove('is-hidden');
    this.startScreen.removeAttribute('hidden');
    this.startScreen.setAttribute('aria-hidden', 'false');
  };

  GameUI.prototype.showHudMath = function () {
    if (!this.hudMathButton) {
      return;
    }
    this.hudMathButton.removeAttribute('hidden');
    this.hudMathButton.classList.add('is-visible');
  };

  GameUI.prototype.hideHudMath = function () {
    if (!this.hudMathButton) {
      return;
    }
    this.hudMathButton.classList.remove('is-visible');
    this.hudMathButton.setAttribute('hidden', '');
  };

  GameUI.prototype.nextCheer = function () {
    var cheers = ['Класс!', 'Супер!', 'Молодец!', 'Здорово!', 'Умница!', 'Вот это да!', 'Браво!', 'Отлично!'];
    var cheer = cheers[this._cheerIndex % cheers.length];
    this._cheerIndex += 1;
    return cheer;
  };

  GameUI.prototype.setHint = function (text) {
    this.hintEl.textContent = text;
  };

  GameUI.prototype.setStars = function (count) {
    this.starsEl.textContent = '⭐ ' + Math.max(0, count);
  };

  GameUI.prototype.setAction = function (icon, label) {
    this.actionIcon.textContent = icon;
    this.actionLabel.textContent = label;
    this.digButton.setAttribute('aria-label', label);
  };

  GameUI.prototype.setNearDigZone = function (isNear) {
    this.digButton.classList.toggle('is-ready', isNear);
  };

  GameUI.prototype.showCount = function (number) {
    this.countEl.textContent = String(number);
    this.countEl.classList.remove('is-pop');
    void this.countEl.offsetWidth;
    this.countEl.classList.add('is-pop');
  };

  GameUI.prototype.showReward = function (starCount, title, text, kind) {
    this.rewardStars.innerHTML = '';
    this.rewardScreen.classList.toggle('is-finale', kind === 'trophy');
    if (this.rewardBadge) {
      this.rewardBadge.textContent = kind === 'trophy' ? 'Город построен!' : 'Задание выполнено!';
    }

    if (kind === 'trophy') {
      var trophy = document.createElement('div');
      trophy.className = 'reward-trophy';
      trophy.setAttribute('aria-hidden', 'true');
      trophy.innerHTML =
        '<svg viewBox="0 0 120 120" class="reward-trophy-svg">' +
        '<ellipse cx="60" cy="108" rx="28" ry="6" fill="#e09100" opacity="0.35"/>' +
        '<rect x="36" y="86" width="48" height="10" rx="4" fill="#f9a825"/>' +
        '<path d="M44 86 L48 72 H72 L76 86 Z" fill="#ffc107"/>' +
        '<path d="M38 28 H82 Q94 28 94 42 Q94 62 60 70 Q26 62 26 42 Q26 28 38 28 Z" fill="#ffd54f" stroke="#f9a825" stroke-width="3"/>' +
        '<path d="M26 36 Q12 38 12 50 Q12 64 32 58" fill="none" stroke="#ffb300" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M94 36 Q108 38 108 50 Q108 64 88 58" fill="none" stroke="#ffb300" stroke-width="7" stroke-linecap="round"/>' +
        '<circle cx="60" cy="46" r="12" fill="#fff59d"/>' +
        '<path d="M60 36 L63 43 H70 L64 48 L66 55 L60 51 L54 55 L56 48 L50 43 H57 Z" fill="#ef6c00"/>' +
        '</svg>';
      this.rewardStars.appendChild(trophy);
      this.rewardTitle.textContent = title;
      this.rewardText.textContent = text;
      this.rewardScreen.removeAttribute('hidden');
      this.rewardScreen.classList.add('is-visible');
      this.hideHudMath();
      this.speak(title + ' ' + text + ' Нажми жёлтую кнопку Дальше.', { queue: true });
    } else {
      var star = document.createElement('span');
      star.className = 'reward-star is-closeup';
      star.textContent = '⭐';
      this.rewardStars.appendChild(star);

      var plus = document.createElement('p');
      plus.className = 'reward-plus';
      plus.textContent = '+1 звезда';
      this.rewardStars.appendChild(plus);

      this.rewardTitle.textContent = title;
      this.rewardText.textContent = text;
      this.rewardScreen.removeAttribute('hidden');
      this.rewardScreen.classList.add('is-visible');
      this.hideHudMath();
      this.speak(this.nextCheer() + ' ' + title + ' ' + text + ' Нажми жёлтую кнопку Дальше.', { queue: true });
    }
    if (this.audio) {
      this.audio.play('reward');
    }
  };

  GameUI.prototype.hideReward = function () {
    this.rewardScreen.classList.remove('is-visible', 'is-finale');
    this.rewardScreen.setAttribute('hidden', '');
    if (this.rewardBadge) {
      this.rewardBadge.textContent = 'Задание выполнено!';
    }
    if (this.startScreen.classList.contains('is-hidden')) {
      this.showHudMath();
    }
  };

  GameUI.prototype.showVehicleBar = function (activeName) {
    this.vehicleBar.removeAttribute('hidden');
    this.vehicleBar.classList.add('is-visible');
    this.setVehicleActive(activeName || 'crane');
  };

  GameUI.prototype.hideVehicleBar = function () {
    this.vehicleBar.classList.remove('is-visible');
    this.vehicleBar.setAttribute('hidden', '');
  };

  GameUI.prototype.setVehicleActive = function (name) {
    this.vehicleButtons.forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-vehicle') === name);
    });
  };

  GameUI.prototype.speakCount = function (n) {
    if (this.audio) {
      this.audio.speakCount(n);
    }
  };

  GameUI.prototype.speak = function (text, options) {
    if (this.audio) {
      this.audio.speak(text, options);
    }
  };

  GameUI.prototype.showMath = function (question, index, total) {
    var self = this;
    this.mathLocked = false;
    this.mathProgress.textContent = index + 1 + ' / ' + total;
    this.mathPrompt.textContent = question.prompt;
    this.mathVisual.textContent = question.visual || '';
    this.mathChoices.innerHTML = '';
    this.mathChoices.classList.remove('is-shake');

    question.choices.forEach(function (choice) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'math-choice';
      button.textContent = choice.label;
      button.addEventListener('click', function () {
        if (self.mathLocked) {
          return;
        }
        if (self.onMathAnswer) {
          self.onMathAnswer(choice.value, question, button);
        }
      });
      self.mathChoices.appendChild(button);
    });

    this.mathScreen.removeAttribute('hidden');
    this.mathScreen.classList.add('is-visible');
    this.hideHudMath();
    this.speak(question.voice);
  };

  GameUI.prototype.markMathWrong = function () {
    this.mathChoices.classList.remove('is-shake');
    void this.mathChoices.offsetWidth;
    this.mathChoices.classList.add('is-shake');
    this.speak('Попробуй ещё, дружок!', { throttleMs: 2200 });
  };

  GameUI.prototype.markMathRight = function (button) {
    this.mathLocked = true;
    if (button) {
      button.classList.add('is-good');
    }
  };

  GameUI.prototype.hideMath = function () {
    this.mathScreen.classList.remove('is-visible');
    this.mathScreen.setAttribute('hidden', '');
    this.mathLocked = false;
  };

  MBS.GameUI = GameUI;
})(window.MBS = window.MBS || {});
