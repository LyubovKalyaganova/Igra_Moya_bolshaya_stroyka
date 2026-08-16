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
        'Привет, строитель! Стрелками слева можно ехать. Подъедь к оранжевому кругу и нажми большую жёлтую кнопку Копать.',
      voiceReadyDig: 'Круг рядом! Нажми большую жёлтую кнопку Копать справа внизу.',
      voiceCoachDig: 'Подъедь к оранжевому кругу. Потом нажми жёлтую кнопку Копать.',
      hintCloser: 'Подъедь ближе к кругу.',
      hintCount: function (current, target) {
        return 'Ковш ' + current + ' из ' + target;
      },
      hintDone: 'Отлично! Яма готова!',
      hintLoad: 'Садись в самосвал и загрузи землю.',
      voiceLoad:
        'Теперь самосвал. Стрелками подъедь к земле и нажми жёлтую кнопку Загрузить.',
      voiceReadyLoad: 'Земля рядом! Нажми кнопку Загрузить.',
      voiceCoachLoad: 'Подъедь самосвалом к кучкам земли и нажми Загрузить.',
      hintLoadCloser: 'Подъедь самосвалом к земле.',
      hintLoadCount: function (current, target) {
        return 'Загружено ' + current + ' из ' + target;
      },
      hintHaul: 'Отвези землю к синему кругу.',
      voiceHaul: 'Поезжай к синему кругу и нажми жёлтую кнопку Выгрузить.',
      voiceReadyUnload: 'Синий круг рядом! Нажми кнопку Выгрузить.',
      voiceCoachUnload: 'Подъедь к синему кругу и нажми Выгрузить.',
      hintUnloadCloser: 'Подъедь к синему кругу.',
      hintUnloadDone: 'Отлично! Земля на месте!',
      hintPour: 'Садись в бетономешалку. Залей фундамент.',
      voicePour:
        'Теперь бетономешалка. Подъедь к яме и нажми жёлтую кнопку Залить.',
      voiceReadyPour: 'Яма рядом! Нажми кнопку Залить.',
      voiceCoachPour: 'Подъедь бетономешалкой к яме и нажми Залить.',
      hintPourCloser: 'Подъедь к яме.',
      hintPourCount: function (current, target) {
        return 'Участок ' + current + ' из ' + target;
      },
      hintPourDone: 'Отлично! Фундамент готов!',
      hintWalls: 'Садись на кран. Поставь стены.',
      voiceWalls: 'Теперь кран. Подъедь к дому и нажми жёлтую кнопку Установить.',
      voiceReadyWalls: 'Дом рядом! Нажми кнопку Установить.',
      voiceCoachWalls: 'Подъедь краном к дому и нажми Установить.',
      hintWallsCloser: 'Подъедь краном к дому.',
      hintWallsCount: function (current, target) {
        return 'Блок ' + current + ' из ' + target;
      },
      hintWallsDone: 'Отлично! Стены готовы!',
      hintFinish: 'Поставь дверь, окна и крышу.',
      voiceFinish: 'Поставь дверь, окна и крышу. Нажми жёлтую кнопку Поставить.',
      voiceReadyFinish: 'Дом рядом! Нажми кнопку Поставить.',
      voiceCoachFinish: 'Подъедь краном к дому и нажми Поставить.',
      hintFinishCloser: 'Подъедь краном к дому.',
      hintFinishCount: function (current, target) {
        return 'Часть ' + current + ' из ' + target;
      },
      hintFinishDone: 'Ура! Дом готов!',
      hintFree: 'Молодец! Можно покататься.',
      voiceFree: 'Ура, дом готов! Можно покататься на машинках. Стрелками езди куда хочешь.',
      voiceNext: 'Задание выполнено! Нажми жёлтую кнопку Дальше.',
      voicePlay: 'Нажми большую жёлтую кнопку Играть.',
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
