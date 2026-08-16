(function (MBS) {
  function PlayerInput() {
    this.forward = false;
    this.back = false;
    this.left = false;
    this.right = false;
    this.digHeld = false;
    this.digPressed = false;
    this._onKeyDown = this._handleKey.bind(this, true);
    this._onKeyUp = this._handleKey.bind(this, false);
  }

  PlayerInput.prototype.attach = function () {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  };

  PlayerInput.prototype.detach = function () {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  };

  PlayerInput.prototype.setMove = function (direction, isDown) {
    this[direction] = isDown;
  };

  PlayerInput.prototype.pressDig = function () {
    this.digHeld = true;
    this.digPressed = true;
  };

  PlayerInput.prototype.releaseDig = function () {
    this.digHeld = false;
  };

  PlayerInput.prototype.consumeDigPress = function () {
    var pressed = this.digPressed;
    this.digPressed = false;
    return pressed;
  };

  PlayerInput.prototype.reset = function () {
    this.forward = false;
    this.back = false;
    this.left = false;
    this.right = false;
    this.digHeld = false;
    this.digPressed = false;
  };

  PlayerInput.prototype._handleKey = function (isDown, event) {
    var code = event.code;
    var isControlKey =
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'KeyW' ||
      code === 'KeyA' ||
      code === 'KeyS' ||
      code === 'KeyD' ||
      code === 'Space' ||
      code === 'KeyE';

    if (isControlKey) {
      event.preventDefault();
    }

    if (code === 'ArrowUp' || code === 'KeyW') {
      this.forward = isDown;
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      this.back = isDown;
    }
    if (code === 'ArrowLeft' || code === 'KeyA') {
      this.left = isDown;
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      this.right = isDown;
    }
    if (code === 'Space' || code === 'KeyE') {
      if (isDown && !this.digHeld) {
        this.digPressed = true;
      }
      this.digHeld = isDown;
    }
  };

  MBS.PlayerInput = PlayerInput;
})(window.MBS = window.MBS || {});
