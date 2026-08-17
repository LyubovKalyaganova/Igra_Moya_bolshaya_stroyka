(function (MBS) {
  function GameUI(root) {
    this.root = root;
    this.startScreen = root.querySelector('#start-screen');
    this.playButton = root.querySelector('#btn-play');
    this.hintEl = root.querySelector('#hint');
    this.starsEl = root.querySelector('#stars');
    this.countEl = root.querySelector('#count-pop');
    this.digButton = root.querySelector('#btn-dig');
    this.actionIcon = root.querySelector('.dig-icon');
    this.actionLabel = root.querySelector('.action-label');
    this.moveButtons = root.querySelectorAll('[data-move]');
    this.rewardScreen = root.querySelector('#reward-screen');
    this.rewardStars = root.querySelector('#reward-stars');
    this.rewardTitle = root.querySelector('#reward-title');
    this.rewardText = root.querySelector('#reward-text');
    this.nextButton = root.querySelector('#btn-next');
    this.muteButton = root.querySelector('#btn-mute');
    this.volDownButton = root.querySelector('#btn-vol-down');
    this.volUpButton = root.querySelector('#btn-vol-up');
    this.audio = null;
    this.onPlay = null;
    this.onNext = null;
    this.onDigPress = null;
    this.onDigRelease = null;
    this.onMoveChange = null;
  }

  GameUI.prototype.bind = function () {
    var self = this;

    this.playButton.addEventListener('click', function () {
      self.hideStart();
      if (self.onPlay) {
        self.onPlay();
      }
    });

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

  GameUI.prototype.showReward = function (starCount, title, text) {
    this.rewardStars.innerHTML = '';

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
    this.speak('Ура! ' + title + ' ' + text + ' Нажми жёлтую кнопку Дальше. Ты молодец!');
    if (this.audio) {
      this.audio.play('reward');
    }
  };

  GameUI.prototype.hideReward = function () {
    this.rewardScreen.classList.remove('is-visible');
    this.rewardScreen.setAttribute('hidden', '');
  };

  GameUI.prototype.speak = function (text, options) {
    if (this.audio) {
      this.audio.speak(text, options);
    }
  };

  MBS.GameUI = GameUI;
})(window.MBS = window.MBS || {});
