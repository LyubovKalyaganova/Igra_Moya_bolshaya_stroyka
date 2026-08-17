(function (MBS) {
  var LEVELS = [
    {
      id: 1,
      name: 'Знакомство со стройкой',
      digTarget: 3,
      loadTarget: 3,
      hintHello: 'Привет, строитель!',
      hintTask: 'Нам нужно выкопать яму.',
      voiceStart:
        'Привет, мой строитель! Я очень рада тебя видеть. Стрелками слева можно ехать. Подъедь к оранжевому кругу и нажми большую жёлтую кнопку Копать. Давай вместе!',
      voiceReadyDig: 'Ура, круг совсем рядом! Жми жёлтую кнопку Копать справа внизу!',
      voiceCoachDig: 'Поезжай к оранжевому кругу, дружок. А потом нажми жёлтую кнопку Копать!',
      hintCloser: 'Подъедь ближе к кругу, пожалуйста!',
      hintCount: function (current, target) {
        return 'Ковш ' + current + ' из ' + target;
      },
      hintDone: 'Отлично! Яма готова!',
      hintLoad: 'Садись в самосвал и загрузи землю.',
      voiceLoad:
        'Супер! Теперь садись в самосвал. Подъедь к земле и нажми жёлтую кнопку Загрузить. Ты справишься!',
      voiceReadyLoad: 'Земля рядом! Жми кнопку Загрузить!',
      voiceCoachLoad: 'Подъедь самосвалом к кучкам земли, и нажми Загрузить. Я в тебя верю!',
      hintLoadCloser: 'Подъедь самосвалом поближе к земле!',
      hintLoadCount: function (current, target) {
        return 'Загружено ' + current + ' из ' + target;
      },
      hintHaul: 'Отвези землю к синему кругу.',
      voiceHaul: 'Класс! Теперь поезжай к синему кругу и нажми жёлтую кнопку Выгрузить.',
      voiceReadyUnload: 'Синий круг рядом! Жми кнопку Выгрузить!',
      voiceCoachUnload: 'Подъедь к синему кругу, дружок, и нажми Выгрузить!',
      hintUnloadCloser: 'Подъедь поближе к синему кругу!',
      hintUnloadDone: 'Отлично! Земля на месте!',
      hintPour: 'Садись в бетономешалку. Залей фундамент.',
      voicePour:
        'Умница! Теперь бетономешалка. Подъедь к яме и нажми жёлтую кнопку Залить. Это будет красиво!',
      voiceReadyPour: 'Яма рядом! Жми кнопку Залить!',
      voiceCoachPour: 'Подъедь бетономешалкой к яме и нажми Залить. Давай!',
      hintPourCloser: 'Подъедь поближе к яме, пожалуйста!',
      hintPourCount: function (current, target) {
        return 'Участок ' + current + ' из ' + target;
      },
      hintPourDone: 'Отлично! Фундамент готов!',
      hintWalls: 'Садись на кран. Поставь стены.',
      voiceWalls: 'Вау, какой ты молодец! Теперь кран. Подъедь к дому и нажми жёлтую кнопку Установить.',
      voiceReadyWalls: 'Дом рядом! Жми кнопку Установить!',
      voiceCoachWalls: 'Подъедь краном к дому и нажми Установить. Стены будут яркие!',
      hintWallsCloser: 'Подъедь краном поближе к дому!',
      hintWallsCount: function (current, target) {
        return 'Блок ' + current + ' из ' + target;
      },
      hintWallsDone: 'Отлично! Стены готовы!',
      hintFinish: 'Поставь дверь, окна и крышу.',
      voiceFinish: 'Почти готово! Поставь дверь, окна и крышу. Нажми жёлтую кнопку Поставить. Я рядом!',
      voiceReadyFinish: 'Дом рядом! Жми кнопку Поставить!',
      voiceCoachFinish: 'Подъедь краном к дому и нажми Поставить. Сейчас будет уютно!',
      hintFinishCloser: 'Подъедь краном поближе к дому!',
      hintFinishCount: function (current, target) {
        return 'Часть ' + current + ' из ' + target;
      },
      hintFinishDone: 'Ура! Дом готов!',
      hintFree: 'Молодец! Можно покататься.',
      voiceFree: 'Ура, дом готов! Ты настоящий строитель. Можно покататься на машинках. Езди куда хочешь!',
      voiceNext: 'Ура, задание выполнено! Нажми жёлтую кнопку Дальше, и поедем дальше!',
      voicePlay: 'Нажми большую жёлтую кнопку Играть. Я тебя жду!',
      rewardDigTitle: 'Отличная работа!',
      rewardDigText: 'Ты выкопал яму и заработал звезду!',
      rewardHaulTitle: 'Супер, строитель!',
      rewardHaulText: 'Ты вывез землю и заработал ещё звезду!',
      rewardPourTitle: 'Умница!',
      rewardPourText: 'Ты залил фундамент и заработал звезду!',
      rewardWallsTitle: 'Молодец!',
      rewardWallsText: 'Ты поставил стены и заработал звезду!',
      rewardFinishTitle: 'Дом построен!',
      rewardFinishText: 'Ты поставил окна, дверь и крышу!',
      pourTarget: 3,
      wallTarget: 5,
      finishTarget: 5,
    },
  ];

  function getLevel(id) {
    id = id || 1;
    for (var i = 0; i < LEVELS.length; i += 1) {
      if (LEVELS[i].id === id) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }

  MBS.LEVELS = LEVELS;
  MBS.getLevel = getLevel;
})(window.MBS = window.MBS || {});
