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
    this.mathBadge = root.querySelector('#play-badge');
    this.mathProgress = root.querySelector('#math-progress');
    this.mathPrompt = root.querySelector('#math-prompt');
    this.mathVisual = root.querySelector('#math-visual');
    this.mathChoices = root.querySelector('#math-choices');
    this.mathBackButton = root.querySelector('#btn-math-back');
    this.mathLocked = false;
    this._playPicked = null;
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
    this.onPlayPick = null;
    this.onMathBack = null;
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

    if (this.mathBackButton) {
      this.mathBackButton.addEventListener('click', function () {
        if (self.onMathBack) {
          self.onMathBack();
        }
      });
    }

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

  GameUI.prototype.nextPlayPraise = function (isLast) {
    var praises = [
      'Молодец!',
      'Умница!',
      'Ты справился!',
      'Класс!',
      'Супер!',
    ];
    var praise = praises[this._cheerIndex % praises.length];
    this._cheerIndex += 1;
    if (isLast) {
      return praise;
    }
    return praise + ' Давай дальше!';
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

  GameUI.prototype._openMathScreen = function () {
    this.mathLocked = false;
    this._playPicked = null;
    if (this.mathBadge) {
      this.mathBadge.textContent = 'Задания на стройке';
    }
    this.mathChoices.innerHTML = '';
    this.mathChoices.classList.remove('is-shake', 'is-puzzle-tray');
    this.mathVisual.innerHTML = '';
    this.mathVisual.textContent = '';
    this.mathScreen.classList.remove('is-puzzle');
    this.mathScreen.removeAttribute('hidden');
    this.mathScreen.classList.add('is-visible');
    this.hideHudMath();
  };

  GameUI.prototype.showPlayHub = function (done) {
    var self = this;
    done = done || {};
    this._openMathScreen();
    this.mathScreen.classList.add('is-play');
    this.mathVisual.classList.add('has-html');
    var finished = (done.count ? 1 : 0) + (done.puzzle ? 1 : 0) + (done.shadow ? 1 : 0);
    this.mathProgress.textContent = finished + ' / 3';
    this.mathPrompt.textContent = 'Выбери игру';

    var games = [
      { id: 'count', title: 'Посчитай', hint: 'цифры и кирпичики' },
      { id: 'puzzle', title: 'Пазл', hint: 'собери машинки' },
      { id: 'shadow', title: 'Тени', hint: 'найди тень машины' },
    ];
    games.forEach(function (game) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'play-hub-btn';
      if (done[game.id]) {
        button.classList.add('is-done');
      }
      button.innerHTML =
        '<span class="play-hub-title">' +
        game.title +
        '</span><span class="play-hub-hint">' +
        (done[game.id] ? 'Готово!' : game.hint) +
        '</span>';
      button.addEventListener('click', function () {
        if (self.mathLocked) {
          return;
        }
        if (self.onPlayPick) {
          self.onPlayPick(game.id);
        }
      });
      self.mathChoices.appendChild(button);
    });
  };

  GameUI.prototype.showMath = function (question, index, total) {
    this._openMathScreen();
    this.mathProgress.textContent = index + 1 + ' / ' + total;
    this.mathPrompt.textContent = question.prompt;
    this.mathVisual.classList.toggle(
      'has-html',
      !!(question.visualHtml || question.kind === 'puzzle' || question.kind === 'shadow'),
    );
    this.mathScreen.classList.toggle('is-play', question.kind === 'puzzle' || question.kind === 'shadow');
    this.mathScreen.classList.toggle('is-puzzle', question.kind === 'puzzle');

    if (question.kind === 'puzzle') {
      this._showPuzzle(question);
    } else if (question.kind === 'shadow') {
      this._showShadow(question);
    } else {
      this._showChoice(question);
    }

    if (question.voice) {
      this.speak(question.voice);
    }
  };

  GameUI.prototype._showChoice = function (question) {
    var self = this;
    if (question.visualHtml) {
      this.mathVisual.innerHTML = question.visualHtml;
    } else {
      this.mathVisual.textContent = question.visual || '';
    }

    (question.choices || []).forEach(function (choice) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'math-choice';
      if (choice.labelHtml) {
        button.classList.add('is-picture');
        button.innerHTML = choice.labelHtml;
      } else {
        button.textContent = choice.label;
      }
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
  };

  GameUI.prototype._shuffle = function (items) {
    var copy = items.slice();
    var i;
    for (i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  };

  GameUI.prototype._showPuzzle = function (question) {
    var self = this;
    var cols = question.cols || 2;
    var rows = question.rows || 2;
    var total = cols * rows;
    var order = [];
    var i;
    for (i = 0; i < total; i += 1) {
      order.push(i);
    }
    order = this._shuffle(order);

    var board = document.createElement('div');
    board.className = 'puzzle-board';
    board.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

    var ghost = document.createElement('div');
    ghost.className = 'puzzle-ghost';
    ghost.innerHTML = question.art;
    board.appendChild(ghost);

    for (i = 0; i < total; i += 1) {
      var slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'puzzle-slot';
      slot.setAttribute('data-slot', String(i));
      slot.addEventListener('click', function () {
        self._placePuzzle(question, this);
      });
      board.appendChild(slot);
    }
    this.mathVisual.appendChild(board);
    this.mathChoices.classList.add('is-puzzle-tray');

    order.forEach(function (id) {
      var piece = document.createElement('button');
      piece.type = 'button';
      piece.className = 'puzzle-piece';
      piece.setAttribute('data-piece', String(id));
      piece.innerHTML = question.art;
      var col = id % cols;
      var row = Math.floor(id / cols);
      var art = piece.querySelector('svg');
      if (art) {
        art.setAttribute(
          'viewBox',
          col * (200 / cols) + ' ' + row * (160 / rows) + ' ' + 200 / cols + ' ' + 160 / rows,
        );
      }
      piece.addEventListener('click', function () {
        if (self.mathLocked || this.classList.contains('is-placed')) {
          return;
        }
        var prev = self.mathChoices.querySelector('.puzzle-piece.is-picked');
        if (prev) {
          prev.classList.remove('is-picked');
        }
        this.classList.add('is-picked');
        self._playPicked = this;
      });
      self.mathChoices.appendChild(piece);
    });
  };

  GameUI.prototype._placePuzzle = function (question, slot) {
    if (this.mathLocked || !this._playPicked || slot.classList.contains('is-filled')) {
      return;
    }
    var pieceId = this._playPicked.getAttribute('data-piece');
    var slotId = slot.getAttribute('data-slot');
    if (pieceId !== slotId) {
      this.markMathWrong();
      return;
    }
    slot.classList.add('is-filled');
    slot.innerHTML = this._playPicked.innerHTML;
    this._playPicked.classList.add('is-placed');
    this._playPicked.classList.remove('is-picked');
    this._playPicked = null;
    if (this.mathVisual.querySelectorAll('.puzzle-slot.is-filled').length === (question.cols || 2) * (question.rows || 2)) {
      if (this.onMathAnswer) {
        this.onMathAnswer('done', question, slot);
      }
    }
  };

  GameUI.prototype._showShadow = function (question) {
    var self = this;
    var names = question.vehicles || [];
    var top = document.createElement('div');
    top.className = 'shadow-row';
    names.forEach(function (name) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'shadow-item is-color';
      button.setAttribute('data-name', name);
      button.innerHTML = MBS.vehicleSvg(name);
      button.addEventListener('click', function () {
        if (self.mathLocked || this.classList.contains('is-matched')) {
          return;
        }
        var prev = self.mathVisual.querySelector('.shadow-item.is-picked');
        if (prev) {
          prev.classList.remove('is-picked');
        }
        this.classList.add('is-picked');
        self._playPicked = this;
      });
      top.appendChild(button);
    });
    this.mathVisual.appendChild(top);

    this._shuffle(names).forEach(function (name) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'shadow-item is-shade';
      button.setAttribute('data-name', name);
      button.innerHTML = MBS.vehicleSvg(name, true);
      button.addEventListener('click', function () {
        self._placeShadow(question, this);
      });
      self.mathChoices.appendChild(button);
    });
  };

  GameUI.prototype._placeShadow = function (question, shade) {
    if (this.mathLocked || !this._playPicked || shade.classList.contains('is-matched')) {
      return;
    }
    if (this._playPicked.getAttribute('data-name') !== shade.getAttribute('data-name')) {
      this.markMathWrong();
      return;
    }
    this._playPicked.classList.add('is-matched');
    this._playPicked.classList.remove('is-picked');
    shade.classList.add('is-matched');
    this._playPicked = null;
    var need = (question.vehicles || []).length;
    if (this.mathVisual.querySelectorAll('.shadow-item.is-matched').length >= need) {
      if (this.onMathAnswer) {
        this.onMathAnswer('done', question, shade);
      }
    }
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
    this.mathScreen.classList.remove('is-visible', 'is-play', 'is-puzzle');
    this.mathScreen.setAttribute('hidden', '');
    this.mathLocked = false;
    this._playPicked = null;
  };

  MBS.GameUI = GameUI;
})(window.MBS = window.MBS || {});
