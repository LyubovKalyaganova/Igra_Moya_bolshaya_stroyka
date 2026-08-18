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

  function vehiclesHtml(name, count) {
    var html = '<div class="play-bricks">';
    var i;
    for (i = 0; i < count; i += 1) {
      html += vehicleSvg(name);
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
      crane:
        '<circle cx="18" cy="50" r="5" fill="#212121"/>' +
        '<circle cx="32" cy="50" r="5" fill="#212121"/>' +
        '<rect x="10" y="36" width="28" height="12" rx="2" fill="#ffc107"/>' +
        '<rect x="20" y="10" width="6" height="28" fill="#ff9800"/>' +
        '<path d="M26 12 H52" stroke="#ffb300" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M50 12 V28" stroke="#90a4ae" stroke-width="2"/>' +
        '<rect x="47" y="28" width="6" height="5" fill="#ef5350"/>',
      bulldozer:
        '<rect x="10" y="38" width="34" height="12" rx="3" fill="#5d4037"/>' +
        '<rect x="14" y="22" width="26" height="18" rx="3" fill="#ffc107"/>' +
        '<rect x="18" y="12" width="16" height="12" rx="2" fill="#ffb300"/>' +
        '<rect x="20" y="14" width="12" height="7" rx="1" fill="#81d4fa"/>' +
        '<rect x="44" y="20" width="8" height="28" rx="2" fill="#78909c"/>' +
        '<rect x="42" y="44" width="14" height="6" fill="#546e7a"/>',
    };
    return (
      '<svg class="' +
      cls +
      '" viewBox="0 0 64 64" aria-hidden="true">' +
      (body[name] || body.excavator) +
      '</svg>'
    );
  }

  function puzzleArt(name) {
    var arts = {
      dumpTruck:
        '<rect x="8" y="126" width="184" height="16" rx="6" fill="#e0e0e0"/>' +
        '<circle cx="52" cy="126" r="18" fill="#212121"/>' +
        '<circle cx="52" cy="126" r="8" fill="#90a4ae"/>' +
        '<circle cx="148" cy="126" r="18" fill="#212121"/>' +
        '<circle cx="148" cy="126" r="8" fill="#90a4ae"/>' +
        '<rect x="16" y="58" width="58" height="56" rx="10" fill="#ff6d00"/>' +
        '<rect x="26" y="66" width="32" height="24" rx="5" fill="#81d4fa"/>' +
        '<circle cx="36" cy="76" r="5" fill="#fff"/>' +
        '<path d="M74 46 H186 L174 114 H74 Z" fill="#ffcc80" stroke="#ef6c00" stroke-width="4"/>' +
        '<rect x="84" y="54" width="82" height="12" fill="#ffe082"/>',
      roller:
        '<rect x="8" y="126" width="184" height="16" rx="6" fill="#e0e0e0"/>' +
        '<circle cx="48" cy="100" r="38" fill="#607d8b"/>' +
        '<circle cx="48" cy="100" r="22" fill="#90a4ae"/>' +
        '<circle cx="48" cy="100" r="8" fill="#eceff1"/>' +
        '<circle cx="148" cy="122" r="18" fill="#212121"/>' +
        '<circle cx="148" cy="122" r="8" fill="#90a4ae"/>' +
        '<rect x="70" y="52" width="88" height="56" rx="10" fill="#ffee58"/>' +
        '<rect x="92" y="22" width="52" height="38" rx="8" fill="#ffc107"/>' +
        '<rect x="100" y="30" width="36" height="22" rx="5" fill="#81d4fa"/>' +
        '<circle cx="112" cy="40" r="4" fill="#fff"/>',
      mixer:
        '<rect x="8" y="126" width="184" height="16" rx="6" fill="#e0e0e0"/>' +
        '<circle cx="46" cy="126" r="16" fill="#212121"/>' +
        '<circle cx="46" cy="126" r="7" fill="#90a4ae"/>' +
        '<circle cx="132" cy="126" r="16" fill="#212121"/>' +
        '<circle cx="132" cy="126" r="7" fill="#90a4ae"/>' +
        '<rect x="16" y="60" width="54" height="52" rx="10" fill="#ffd54f"/>' +
        '<rect x="24" y="68" width="30" height="22" rx="5" fill="#81d4fa"/>' +
        '<circle cx="34" cy="78" r="4" fill="#fff"/>' +
        '<ellipse cx="132" cy="78" rx="46" ry="36" fill="#90caf9" stroke="#546e7a" stroke-width="4"/>' +
        '<path d="M98 78 Q132 40 166 78 Q132 116 98 78" fill="none" stroke="#fff" stroke-width="5"/>' +
        '<rect x="70" y="96" width="22" height="18" fill="#ff9800"/>',
      excavator:
        '<rect x="8" y="126" width="184" height="16" rx="6" fill="#e0e0e0"/>' +
        '<rect x="18" y="108" width="92" height="22" rx="8" fill="#424242"/>' +
        '<rect x="28" y="70" width="78" height="44" rx="8" fill="#ffc107"/>' +
        '<rect x="38" y="38" width="42" height="38" rx="6" fill="#ffb300"/>' +
        '<rect x="44" y="44" width="30" height="20" rx="4" fill="#81d4fa"/>' +
        '<circle cx="52" cy="54" r="4" fill="#fff"/>' +
        '<path d="M100 84 L158 48" stroke="#ff9800" stroke-width="14" stroke-linecap="round"/>' +
        '<path d="M158 48 L176 78" stroke="#ffb300" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M164 78 L196 96 L156 104 Z" fill="#607d8b"/>',
      crane:
        '<rect x="8" y="126" width="184" height="16" rx="6" fill="#e0e0e0"/>' +
        '<circle cx="46" cy="126" r="14" fill="#212121"/>' +
        '<circle cx="78" cy="126" r="14" fill="#212121"/>' +
        '<rect x="24" y="92" width="76" height="28" rx="8" fill="#ffc107"/>' +
        '<rect x="54" y="18" width="16" height="80" fill="#ff9800"/>' +
        '<path d="M70 24 H176" stroke="#ffb300" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M168 24 V78" stroke="#90a4ae" stroke-width="4"/>' +
        '<rect x="158" y="78" width="20" height="16" rx="3" fill="#ef5350"/>' +
        '<rect x="34" y="98" width="22" height="14" rx="3" fill="#81d4fa"/>',
    };
    return (
      '<svg class="puzzle-art" viewBox="0 0 200 160" aria-hidden="true">' +
      (arts[name] || arts.excavator) +
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
      id: 'count1',
      kind: 'choice',
      prompt: 'Сколько звёзд?',
      visual: '⭐',
      voice: 'Посмотри на звёздочки. Сколько их? Нажми нужную цифру.',
      choices: digitChoices(1),
      answer: 1,
      speakNumber: true,
    },
    {
      id: 'count2',
      kind: 'choice',
      prompt: 'Сколько кирпичей?',
      visualHtml: bricksHtml(2),
      voice: 'Посчитай кирпичики. Сколько их? Нажми цифру.',
      choices: digitChoices(2),
      answer: 2,
      speakNumber: true,
    },
    {
      id: 'count3',
      kind: 'choice',
      prompt: 'Сколько самосвалов?',
      visualHtml: vehiclesHtml('dumpTruck', 3),
      voice: 'Посчитай самосвалы. Сколько их? Нажми цифру.',
      choices: digitChoices(3),
      answer: 3,
      speakNumber: true,
    },
    {
      id: 'count4',
      kind: 'choice',
      prompt: 'Сколько звёзд?',
      visual: '⭐⭐⭐⭐',
      voice: 'Посчитай звёздочки. Сколько их? Нажми цифру.',
      choices: digitChoices(4),
      answer: 4,
      speakNumber: true,
    },
    {
      id: 'count5',
      kind: 'choice',
      prompt: 'Сколько кирпичей?',
      visualHtml: bricksHtml(5),
      voice: 'Посчитай кирпичики. Сколько их? Нажми цифру.',
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
        { labelHtml: vehiclesHtml('dumpTruck', 2), value: 'left' },
        { labelHtml: vehiclesHtml('dumpTruck', 4), value: 'right' },
      ],
      answer: 'right',
      speakNumber: false,
    },
    {
      id: 'add',
      kind: 'choice',
      prompt: 'Было 2 кирпича. Привезли ещё 1. Сколько стало?',
      visualHtml: '<div class="play-formula">' + bricksHtml(2) + '<span class="play-op">+</span>' + bricksHtml(1) + '</div>',
      voice: 'У нас было два кирпича. Привезли ещё один. Сколько стало? Нажми цифру.',
      choices: digitChoices(3),
      answer: 3,
      speakNumber: true,
    },
    {
      id: 'sub',
      kind: 'choice',
      prompt: 'Было 4 кирпича. Убрали 1. Сколько осталось?',
      visualHtml: '<div class="play-formula">' + bricksHtml(4) + '<span class="play-op">→</span>' + bricksHtml(3) + '</div>',
      voice: 'Было четыре кирпича. Один убрали. Сколько осталось?',
      choices: digitChoices(3),
      answer: 3,
      speakNumber: true,
    },
  ];

  var PUZZLE_TASKS = [
    {
      id: 'puzzle-dump',
      kind: 'puzzle',
      prompt: 'Собери самосвал',
      voice: 'Собери картинку самосвала. Нажми деталь, потом нажми её место.',
      art: puzzleArt('dumpTruck'),
      cols: 2,
      rows: 2,
      answer: 'done',
      speakNumber: false,
    },
    {
      id: 'puzzle-roller',
      kind: 'puzzle',
      prompt: 'Собери каток',
      voice: 'Теперь собери каток. Нажми деталь, потом нажми её место.',
      art: puzzleArt('roller'),
      cols: 2,
      rows: 2,
      answer: 'done',
      speakNumber: false,
    },
    {
      id: 'puzzle-mixer',
      kind: 'puzzle',
      prompt: 'Собери бетономешалку',
      voice: 'Собери бетономешалку. Нажми деталь, потом нажми её место.',
      art: puzzleArt('mixer'),
      cols: 2,
      rows: 2,
      answer: 'done',
      speakNumber: false,
    },
    {
      id: 'puzzle-excavator',
      kind: 'puzzle',
      prompt: 'Собери экскаватор',
      voice: 'Собери экскаватор. Нажми деталь, потом нажми её место.',
      art: puzzleArt('excavator'),
      cols: 2,
      rows: 2,
      answer: 'done',
      speakNumber: false,
    },
    {
      id: 'puzzle-crane',
      kind: 'puzzle',
      prompt: 'Собери кран',
      voice: 'И последний: собери кран. Нажми деталь, потом нажми её место.',
      art: puzzleArt('crane'),
      cols: 2,
      rows: 2,
      answer: 'done',
      speakNumber: false,
    },
  ];

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
  MBS.PLAY_PUZZLES = PUZZLE_TASKS;
  MBS.PLAY_PUZZLE = PUZZLE_TASKS[0];
  MBS.PLAY_SHADOW = SHADOW_TASK;
  MBS.MATH_QUESTIONS = COUNT_TASKS;
})(window.MBS = window.MBS || {});
