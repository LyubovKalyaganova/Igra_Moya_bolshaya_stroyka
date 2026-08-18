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
      hintGrade: 'Возьми бульдозер. Расчисти дорогу.',
      voiceGrade:
        'Дом готов! Теперь построим дорогу. Бульдозер умеет толкать землю. Подъедь к кучке и нажми жёлтую кнопку Толкать.',
      voiceReadyGrade: 'Кучка рядом! Жми кнопку Толкать!',
      voiceCoachGrade: 'Подъедь бульдозером к жёлтому кругу и нажми Толкать.',
      hintGradeCloser: 'Подъедь бульдозером поближе к кучке!',
      hintGradeCount: function (current, target) {
        return 'Кучка ' + current + ' из ' + target;
      },
      hintGradeDone: 'Отлично! Участок ровный!',
      hintGravel: 'Садись в самосвал. Загрузи камешки.',
      voiceGravel:
        'Самосвал перевозит груз. Подъедь к кучке камешков и нажми Загрузить. Нужно три ковша.',
      voiceReadyGravel: 'Камешки рядом! Жми кнопку Загрузить!',
      voiceCoachGravel: 'Подъедь самосвалом к камешкам и нажми Загрузить.',
      hintGravelCloser: 'Подъедь самосвалом поближе к камешкам!',
      hintGravelCount: function (current, target) {
        return 'Камешки ' + current + ' из ' + target;
      },
      hintGravelHaul: 'Отвези камешки на дорогу.',
      voiceGravelHaul: 'Класс! Теперь поезжай к жёлтому кругу на дороге и нажми Выгрузить.',
      voiceReadyGravelUnload: 'Дорога рядом! Жми кнопку Выгрузить!',
      voiceCoachGravelUnload: 'Подъедь к жёлтому кругу и нажми Выгрузить.',
      hintGravelUnloadCloser: 'Подъедь поближе к дороге!',
      hintGravelUnloadDone: 'Отлично! Материал на месте!',
      hintRoll: 'Садись на каток. Выровняй дорогу.',
      voiceRoll:
        'Каток умеет выравнивать дорогу. Подъедь к жёлтому кругу и нажми жёлтую кнопку Катить. Давай посчитаем плитки!',
      voiceReadyRoll: 'Круг рядом! Жми кнопку Катить!',
      voiceCoachRoll: 'Подъедь катком к жёлтому кругу и нажми Катить.',
      hintRollCloser: 'Подъедь катком поближе к кругу!',
      hintRollCount: function (current, target) {
        return 'Плитка ' + current + ' из ' + target;
      },
      hintRollDone: 'Ура! Дорога готова!',
      hintBridge: 'Садись на кран. Поставь мост.',
      voiceBridge:
        'Теперь мостик через воду. Кран поднимает тяжёлые блоки. Нужно четыре блока. Подъедь к кругу и нажми Установить.',
      voiceReadyBridge: 'Круг рядом! Жми кнопку Установить!',
      voiceCoachBridge: 'Подъедь краном к жёлтому кругу и нажми Установить.',
      hintBridgeCloser: 'Подъедь краном поближе к кругу!',
      hintBridgeCount: function (current, target) {
        return 'Блок ' + current + ' из ' + target;
      },
      hintBridgeDone: 'Мост готов! Можно ехать дальше.',
      hintPlay: 'Поставь качели, горку и песочницу.',
      voicePlayground:
        'Теперь детская площадка. Поставь песочницу, горку и качели. Подъедь к кругу и нажми Установить.',
      voiceReadyPlay: 'Круг рядом! Жми кнопку Установить!',
      voiceCoachPlay: 'Подъедь краном к жёлтому кругу и нажми Установить.',
      hintPlayCloser: 'Подъедь краном поближе к кругу!',
      hintPlayCount: function (current, target) {
        return 'Предмет ' + current + ' из ' + target;
      },
      hintPlayDone: 'Игрушки на месте!',
      hintBenches: 'Поставь 3 лавочки.',
      voiceBenches: 'Поставь три лавочки. Давай посчитаем! Подъедь к кругу и нажми Установить.',
      voiceReadyBenches: 'Круг рядом! Жми Установить!',
      voiceCoachBenches: 'Подъедь к жёлтому кругу и поставь лавочку.',
      hintBenchesCloser: 'Подъедь поближе к кругу!',
      hintBenchesCount: function (current, target) {
        return 'Лавочка ' + current + ' из ' + target;
      },
      hintBenchesDone: 'Лавочки стоят!',
      hintTrees: 'Посади 4 дерева.',
      voiceTrees: 'Посади четыре деревца. Подъедь к кругу и нажми Посадить.',
      voiceReadyTrees: 'Круг рядом! Жми Посадить!',
      voiceCoachTrees: 'Подъедь к жёлтому кругу и посади дерево.',
      hintTreesCloser: 'Подъедь поближе к кругу!',
      hintTreesCount: function (current, target) {
        return 'Дерево ' + current + ' из ' + target;
      },
      hintTreesDone: 'Какой зелёный парк!',
      hintLamps: 'Поставь 2 фонаря.',
      voiceLamps: 'Поставь два фонарика. Подъедь к кругу и нажми Установить.',
      voiceReadyLamps: 'Круг рядом! Жми Установить!',
      voiceCoachLamps: 'Подъедь к кругу и поставь фонарь.',
      hintLampsCloser: 'Подъедь поближе к кругу!',
      hintLampsCount: function (current, target) {
        return 'Фонарь ' + current + ' из ' + target;
      },
      hintLampsDone: 'Площадка светится!',
      hintMath: 'Посчитай предметы на стройке.',
      voiceMath: 'Посмотри на картинку и нажми правильный ответ. Я рядом!',
      hintFree: 'Молодец! Можно покататься по городу.',
      voiceFree:
        'Ура! Ты построил дом, дорогу, мост и площадку. Ты настоящий строитель. Внизу можно выбрать машинку.',
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
      rewardGradeTitle: 'Участок ровный!',
      rewardGradeText: 'Бульдозер расчистил дорогу!',
      rewardGravelTitle: 'Материал привезён!',
      rewardGravelText: 'Самосвал привёз камешки!',
      rewardRollTitle: 'Какая дорога!',
      rewardRollText: 'Каток выровнял плитки!',
      rewardBridgeTitle: 'Мост готов!',
      rewardBridgeText: 'Четыре блока на месте!',
      rewardPlayTitle: 'Площадка играет!',
      rewardPlayText: 'Горка, качели и песочница на месте!',
      rewardBenchesTitle: 'Лавочки стоят!',
      rewardBenchesText: 'Ты поставил три лавочки!',
      rewardTreesTitle: 'Деревья растут!',
      rewardTreesText: 'Ты посадил четыре дерева!',
      rewardLampsTitle: 'Светло и уютно!',
      rewardLampsText: 'Два фонаря светят на площадке!',
      rewardMathTitle: 'Ты считаешь отлично!',
      rewardMathText: 'Все задания по математике выполнены!',
      pourTarget: 3,
      wallTarget: 5,
      finishTarget: 5,
      gradeTarget: 3,
      gravelTarget: 3,
      rollTarget: 4,
      bridgeTarget: 4,
      playTarget: 3,
      benchTarget: 3,
      treeTarget: 4,
      lampTarget: 2,
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
