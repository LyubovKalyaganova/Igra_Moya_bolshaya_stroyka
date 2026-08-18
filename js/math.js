(function (MBS) {
  function formatCount(current, target) {
    return current + ' / ' + target;
  }

  function nextCount(current, target) {
    return Math.min(target, current + 1);
  }

  function bricksHtml(count) {
    var html = '<div class="play-bricks">';
    var i;
    for (i = 0; i < count; i += 1) {
      html += '<span class="clay-brick" aria-hidden="true"></span>';
    }
    return html + '</div>';
  }

  function vehicleSvg(name, silhouette) {
    var cls = silhouette ? 'play-vehicle is-shadow' : 'play-vehicle';
    var body = {
      excavator:
        '<rect x="8" y="40" width="36" height="10" rx="3" fill="#424242"/>' +
        '<rect x="10" y="26" width="28" height="16" rx="3" fill="#ffc107"/>' +
        '<rect x="14" y="14" width="16" height="14" rx="2" fill="#ffb300"/>' +
        '<rect x="16" y="16" width="12" height="8" rx="1" fill="#81d4fa"/>' +
        '<path d="M36 30 L54 18" stroke="#ff9800" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M54 18 L58 28" stroke="#ffb300" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M52 28 L62 34 L50 36 Z" fill="#607d8b"/>',
      dumpTruck:
        '<circle cx="16" cy="48" r="6" fill="#212121"/>' +
        '<circle cx="46" cy="48" r="6" fill="#212121"/>' +
        '<rect x="6" y="22" width="18" height="18" rx="3" fill="#ff6d00"/>' +
        '<rect x="8" y="24" width="10" height="8" rx="1" fill="#81d4fa"/>' +
        '<path d="M24 18 H56 L52 40 H24 Z" fill="#ffcc80" stroke="#ef6c00" stroke-width="2"/>' +
        '<rect x="26" y="20" width="24" height="4" fill="#ffe082"/>',
      mixer:
        '<circle cx="16" cy="48" r="6" fill="#212121"/>' +
        '<circle cx="44" cy="48" r="6" fill="#212121"/>' +
        '<rect x="6" y="22" width="18" height="18" rx="3" fill="#ffd54f"/>' +
        '<rect x="8" y="24" width="10" height="8" rx="1" fill="#81d4fa"/>' +
        '<ellipse cx="42" cy="30" rx="14" ry="11" fill="#90caf9" stroke="#546e7a" stroke-width="2"/>' +
        '<path d="M32 30 Q42 18 52 30 Q42 42 32 30" fill="none" stroke="#fff" stroke-width="2"/>' +
        '<rect x="24" y="36" width="8" height="8" fill="#ff9800"/>',
      roller:
        '<circle cx="18" cy="40" r="14" fill="#607d8b"/>' +
        '<circle cx="18" cy="40" r="8" fill="#90a4ae"/>' +
        '<circle cx="46" cy="46" r="8" fill="#212121"/>' +
        '<rect x="22" y="18" width="28" height="20" rx="3" fill="#ffee58"/>' +
        '<rect x="28" y="10" width="18" height="12" rx="2" fill="#ffc107"/>' +
        '<rect x="30" y="12" width="14" height="7" rx="1" fill="#81d4fa"/>',
    };
    return (
      '<svg class="' +
      cls +
      '" viewBox="0 0 64 64" aria-hidden="true">' +
      (body[name] || body.excavator) +
      '</svg>'
    );
  }

  function puzzleSvg() {
    return (
      '<svg class="puzzle-art" viewBox="0 0 200 160" aria-hidden="true">' +
      '<rect x="18" y="108" width="92" height="22" rx="8" fill="#424242"/>' +
      '<rect x="28" y="70" width="78" height="44" rx="8" fill="#ffc107"/>' +
      '<rect x="38" y="38" width="42" height="38" rx="6" fill="#ffb300"/>' +
      '<rect x="44" y="44" width="30" height="20" rx="4" fill="#81d4fa"/>' +
      '<circle cx="48" cy="58" r="4" fill="#fff"/>' +
      '<circle cx="62" cy="58" r="4" fill="#fff"/>' +
      '<path d="M100 84 L158 48" stroke="#ff9800" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M158 48 L176 78" stroke="#ffb300" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M164 78 L196 96 L156 104 Z" fill="#607d8b"/>' +
      '</svg>'
    );
  }

  function digitChoices(answer) {
    var start = Math.max(1, Math.min(3, answer - 1));
    if (start + 2 > 5) {
      start = 3;
    }
    return [start, start + 1, start + 2].map(function (value) {
      return { label: String(value), value: value };
    });
  }

  var COUNT_TASKS = [
    {
      id: 'stars',
      kind: 'choice',
      prompt: 'Сколько звёзд?',
      visual: '⭐⭐⭐⭐⭐',
      voice: 'Посмотри на звёздочки. Сколько их? Нажми нужную цифру.',
      choices: digitChoices(5),
      answer: 5,
      speakNumber: true,
    },
    {
      id: 'bricks',
      kind: 'choice',
      prompt: 'Сколько кирпичей?',
      visualHtml: bricksHtml(5),
      voice: 'Посчитай кирпичики. Один, два, три, четыре, пять. Сколько всего?',
      choices: digitChoices(5),
      answer: 5,
      speakNumber: true,
    },
    {
      id: 'more',
      kind: 'choice',
      prompt: 'Где машинок больше?',
      voice: 'Посмотри на две кучки. Где самосвалов больше? Нажми на ту кучку.',
      choices: [
        { labelHtml: vehicleSvg('dumpTruck') + vehicleSvg('dumpTruck'), value: 'left' },
        {
          labelHtml:
            vehicleSvg('dumpTruck') +
            vehicleSvg('dumpTruck') +
            vehicleSvg('dumpTruck') +
            vehicleSvg('dumpTruck') +
            vehicleSvg('dumpTruck'),
          value: 'right',
        },
      ],
      answer: 'right',
      speakNumber: false,
    },
    {
      id: 'add',
      kind: 'choice',
      prompt: 'У нас было 2 кирпича. Привезли ещё 3. Сколько стало?',
      visualHtml: '<div class="play-formula">' + bricksHtml(2) + '<span class="play-op">+</span>' + bricksHtml(3) + '</div>',
      voice: 'У нас было два кирпича. Привезли ещё три. Сколько стало? Нажми цифру.',
      choices: digitChoices(5),
      answer: 5,
      speakNumber: true,
    },
    {
      id: 'sub',
      kind: 'choice',
      prompt: 'Было 5 кирпичей. Убрали 1. Сколько осталось?',
      visualHtml: '<div class="play-formula">' + bricksHtml(5) + '<span class="play-op">→</span>' + bricksHtml(4) + '</div>',
      voice: 'Было пять кирпичей. Один убрали. Сколько осталось?',
      choices: digitChoices(4),
      answer: 4,
      speakNumber: true,
    },
  ];

  var PUZZLE_TASK = {
    id: 'puzzle',
    kind: 'puzzle',
    prompt: 'Собери экскаватор',
    voice: 'Собери картинку экскаватора. Нажми деталь, потом нажми её место.',
    art: puzzleSvg(),
    cols: 2,
    rows: 2,
    answer: 'done',
    speakNumber: false,
  };

  var SHADOW_TASK = {
    id: 'shadow',
    kind: 'shadow',
    prompt: 'Найди, чья это тень',
    voice: 'Найди тень каждой машины. Нажми машинку, потом нажми её тень.',
    vehicles: ['excavator', 'dumpTruck', 'roller'],
    answer: 'done',
    speakNumber: false,
  };

  MBS.formatCount = formatCount;
  MBS.nextCount = nextCount;
  MBS.bricksHtml = bricksHtml;
  MBS.vehicleSvg = vehicleSvg;
  MBS.PLAY_COUNT = COUNT_TASKS;
  MBS.PLAY_PUZZLE = PUZZLE_TASK;
  MBS.PLAY_SHADOW = SHADOW_TASK;
  MBS.MATH_QUESTIONS = COUNT_TASKS;
})(window.MBS = window.MBS || {});
