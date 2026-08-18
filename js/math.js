(function (MBS) {
  function formatCount(current, target) {
    return current + ' / ' + target;
  }

  function nextCount(current, target) {
    return Math.min(target, current + 1);
  }

  var MATH_QUESTIONS = [
    {
      id: 'stars',
      prompt: 'Сколько звёзд?',
      visual: '⭐⭐⭐',
      voice: 'А теперь весёлая математика! Посмотри на звёздочки. Сколько их? Нажми нужную цифру.',
      choices: [
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
      ],
      answer: 3,
      speakNumber: true,
    },
    {
      id: 'bricks',
      prompt: 'Сколько кирпичей?',
      visual: '🧱🧱🧱🧱',
      voice: 'Посчитай кирпичики. Один, два... Сколько всего?',
      choices: [
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 },
      ],
      answer: 4,
      speakNumber: true,
    },
    {
      id: 'more',
      prompt: 'Где машинок больше?',
      visual: '🚗🚗   🚗🚗🚗',
      voice: 'Посмотри на две кучки. Где машинок больше? Нажми на ту кучку.',
      choices: [
        { label: '🚗🚗', value: 'left' },
        { label: '🚗🚗🚗', value: 'right' },
      ],
      answer: 'right',
      speakNumber: false,
    },
    {
      id: 'add',
      prompt: 'У нас было 2 кирпича. Привезли ещё 1. Сколько стало?',
      visual: '🧱🧱  +  🧱',
      voice: 'У нас было два кирпича. Привезли ещё один. Сколько стало? Нажми цифру.',
      choices: [
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
      ],
      answer: 3,
      speakNumber: true,
    },
    {
      id: 'sub',
      prompt: 'Было 3 звёздочки. Одну убрали. Сколько осталось?',
      visual: '⭐⭐⭐  →  ⭐⭐',
      voice: 'Было три звёздочки. Одну убрали. Сколько осталось?',
      choices: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
      ],
      answer: 2,
      speakNumber: true,
    },
  ];

  MBS.formatCount = formatCount;
  MBS.nextCount = nextCount;
  MBS.MATH_QUESTIONS = MATH_QUESTIONS;
})(window.MBS = window.MBS || {});
