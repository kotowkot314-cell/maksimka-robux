const $ = (id) => document.getElementById(id);

let persona = 'female';

document.querySelectorAll('.persona').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.persona').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    persona = btn.dataset.persona;
  });
});

$('clear').addEventListener('click', () => {
  $('input').value = '';
  $('result').classList.add('hidden');
});

$('analyze').addEventListener('click', analyze);

$('input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) analyze();
});

const JUNK = /^[.\s!?…]+$/;

const TONES = {
  flirt: 'флирт',
  sarcasm: 'сарказм',
  dry: 'сухость',
  angry: 'злость',
  shy: 'стеснение',
  spam: 'мусор',
  neutral: 'нейтрально',
  happy: 'радость',
  sad: 'грусть',
  curious: 'любопытство',
  tired: 'усталость',
  playful: 'игривость',
  sexual: 'сексуальный намёк',
  love: 'любовь / нежность',
  danger: 'опасность / мрак'
};

const STYLES = {
  friendly: 'дружелюбно',
  flirty: 'с флиртом',
  cold: 'сдержанно'
};

/* ===================== РАСШИФРОВКА ЭМОДЗИ ===================== */

const EMOJI_MEANINGS = {
  // Любовь и сердца
  '❤': 'любовь, симпатия, тёплые чувства',
  '❤️': 'любовь, симпатия, тёплые чувства',
  '♥️': 'классическое сердце — любовь',
  '💕': 'влюблённость, нежность',
  '💖': 'сверкающая любовь, восхищение',
  '💗': 'растущая любовь, волнение',
  '💘': 'стрела Амура — влюблённость с первого взгляда',
  '💝': 'подарок с любовью',
  '💞': 'кружащиеся сердца — сильная взаимность',
  '💓': 'бьющееся сердце — волнение',
  '💟': 'знак сердца — декоративная любовь',
  '🖤': 'чёрное сердце — тёмной юмор, скорбь или «тёмная» любовь',
  '🤍': 'белое сердце — чистая, невинная любовь',
  '🤎': 'коричневое сердце — тёплая дружба / уют',
  '💜': 'фиолетовое сердце — особая связь, иногда LGBTQ+',
  '💙': 'синее сердце — дружба, доверие, иногда «братанская» любовь',
  '💚': 'зелёное сердце — ревность или природа / здоровье',
  '💛': 'жёлтое сердце — дружба, радость',
  '🧡': 'оранжевое сердце — тёплая симпатия',

  // Сексуальные / намёки
  '🍆': 'баклажан = член (самый популярный эвфемизм)',
  '🍑': 'персик = попа / булки',
  '🌮': 'тако = женские гениталии (реже)',
  '💦': 'брызги = сперма / возбуждение / «финиш»',
  '👅': 'язык = оральный секс / дразнение',
  '👄': 'губы = поцелуй / оральные намёки',
  '💋': 'отпечаток губ = поцелуй',
  '🔥': 'огонь = «горячо», сексуально, круто',
  '🥵': 'жарко / возбуждён',
  '😈': 'чёртовски сексуально, игривый соблазн',
  '😏': 'ухмылка — флирт, намёк, «я знаю что ты думаешь»',
  '👉': 'указание / часто часть секс-комбо',
  '👌': 'ок, но в комбо с 👉 = секс',
  '👉👌': 'классический знак «секс» / половой акт',
  '👉👈': 'стеснение, «нууу...» (очень популярно)',
  '👉 👈': 'стеснение',
  '🦴': 'кость = твёрдый член (реже)',
  '🍌': 'банан = член',
  '🥒': 'огурец = член',
  '🥛': 'молоко = сперма (реже)',
  '🧴': 'лосьон = смазка / намёк',

  // Смерть / мрак / негатив
  '☠️': 'череп с костями — смерть, опасность, «я умер» от смеха/стыда, мрачный юмор',
  '💀': 'череп — «умер», шок, смех до смерти',
  '👻': 'призрак — «я умер» / игривый страх',
  '🔪': 'нож — угроза, «убью», чёрный юмор',
  '🩸': 'кровь — серьёзный вред, период, мрак',
  '😈': 'дьявол — злорадство или сексуальный соблазн (контекст!)',
  '👿': 'злой чёрт — злость',
  '🤡': 'клоун — «ты клоун», насмешка',
  '💩': 'какашка — «говно», плохое качество, шутка',

  // Эмоции лица
  '😂': 'смех до слёз',
  '🤣': 'катаюсь от смеха',
  '😅': 'нервный смех / облегчение',
  '😊': 'искренняя улыбка',
  '😍': 'влюблённые глаза — сильный восторг / влюблённость',
  '🥰': 'умиление, нежность',
  '😘': 'воздушный поцелуй',
  '😗': 'поцелуй',
  '😙': 'поцелуй с улыбкой',
  '😚': 'поцелуй с закрытыми глазами',
  '🤗': 'обнимашки',
  '🤔': 'задумался, сомневается',
  '🤨': 'приподнятая бровь — скепсис, «серьёзно?»',
  '😐': 'нейтральное / «ну ок»',
  '😑': 'без эмоций, раздражение',
  '😶': 'нет слов',
  '🙄': 'закатывание глаз — раздражение, сарказм',
  '😠': 'злость',
  '😡': 'сильная злость / красное лицо',
  '🤬': 'мат / ярость',
  '😢': 'грусть, плач',
  '😭': 'сильный плач',
  '🥺': 'умоляющий взгляд («сделай пожалуйста»)',
  '😳': 'смущение, шок',
  '🫠': 'таю (от стыда / жары / чувств)',
  '😴': 'сон / скука',
  '🥱': 'зевота — скука или усталость',
  '🤮': 'тошнота / «меня тошнит от этого»',
  '🤢': 'тошнота',
  '🥴': 'опьянение / «мне плохо»',
  '😵': 'шок / «мозг взорвался»',
  '🤯': 'взрыв мозга — шок',

  // Жесты и руки
  '👍': 'лайк, согласие, «ок»',
  '👎': 'дизлайк, неодобрение',
  '👏': 'аплодисменты',
  '🙌': 'ура, руки вверх',
  '🤝': 'сделка, согласие',
  '🙏': 'пожалуйста / спасибо / молитва',
  '💪': 'сила, «держись», мотивация',
  '🖕': 'средний палец — явное оскорбление',
  '✌️': 'победа / мир',
  '🤞': 'скрещённые пальцы — удача / «вру»',
  '🤟': '«я тебя люблю» на языке жестов',
  '🤘': 'рок / «круто»',
  '👀': 'глаза — «смотрю», «заметил», иногда намёк',
  '👁️': 'глаз — наблюдение',
  '🧠': 'мозг — ум / «подумай»',

  // Животные и прочее популярное
  '🐱': 'котик — милота / иногда женский символ',
  '🐶': 'пёсик — милота / верность',
  '🦊': 'лиса — хитрость / привлекательность',
  '🐼': 'панда — милота',
  '🦄': 'единорог — уникальность / LGBTQ+',
  '🌹': 'роза — романтика',
  '🥀': 'увядшая роза — разочарование в любви',
  '💍': 'кольцо — предложение / брак',
  '💔': 'разбитое сердце — расставание, боль',
  '✨': 'блеск — красота, магия, «вау»',
  '🌟': 'звезда — восторг',
  '⭐': 'звезда',
  '💯': 'сто процентов — полное согласие / «в точку»',
  '✅': 'галочка — подтверждение',
  '❌': 'крест — отказ / ошибка',
  '⚠️': 'предупреждение',
  '🔞': '18+ — контент для взрослых',
  '💤': 'сон',
  '🎉': 'праздник, поздравление',
  '🎂': 'торт — день рождения',
  '🎁': 'подарок',
  '☕': 'кофе — уют / «давай поговорим»',
  '🍷': 'вино — расслабление / романтика',
  '🥂': 'тост — празднование',
  '🚬': 'сигарета — иногда «нужен перекур» / стресс',
};

const EMOJI_COMBOS = [
  // Самые популярные сексуальные и намёки
  { pattern: /👉\s*👌|👌\s*👉/, meaning: 'Классический жест «секс» / половой акт. Один из самых узнаваемых эротических символов в переписке.', tone: 'sexual', intent: 'сделать сексуальный намёк' },
  { pattern: /👉👈|👉\s*👈/, meaning: 'Стеснение, смущение, «нууу…», кокетство. Очень популярно у молодых.', tone: 'shy', intent: 'выразить смущение / кокетство' },
  { pattern: /🍆\s*💦|💦\s*🍆/, meaning: 'Член + финиш. Прямой сексуальный намёк на семяизвержение.', tone: 'sexual', intent: 'эротический намёк' },
  { pattern: /🍑\s*🍆|🍆\s*🍑/, meaning: 'Попа + член. Намёк на анальный или просто секс сзади.', tone: 'sexual', intent: 'эротический намёк' },
  { pattern: /👅\s*🍑|🍑\s*👅/, meaning: 'Язык + попа. Намёк на римминг / оральные ласки.', tone: 'sexual', intent: 'эротический намёк' },
  { pattern: /👅\s*🍆|🍆\s*👅/, meaning: 'Язык + член. Минет.', tone: 'sexual', intent: 'эротический намёк' },
  { pattern: /🥵\s*🔥|🔥\s*🥵/, meaning: 'Очень горячо / сильно возбуждён.', tone: 'sexual', intent: 'показать возбуждение' },
  { pattern: /😏\s*👉|👉\s*😏/, meaning: 'Ухмылка + указание. Игривый сексуальный намёк.', tone: 'flirt', intent: 'пофлиртовать' },
  { pattern: /👀\s*🍆|🍆\s*👀/, meaning: 'Смотрю на «это». Намёк, что заметил сексуальный контент.', tone: 'sexual', intent: 'показать интерес' },
  { pattern: /💋\s*💦|💦\s*💋/, meaning: 'Поцелуй + жидкость. Очень откровенный намёк.', tone: 'sexual', intent: 'эротический намёк' },

  // Эмоциональные комбо
  { pattern: /❤\s*🔥|🔥\s*❤|❤️\s*🔥/, meaning: 'Горячая любовь / страсть.', tone: 'love', intent: 'выразить страсть' },
  { pattern: /💔\s*😢|😢\s*💔|😭\s*💔/, meaning: 'Разбитое сердце + слёзы. Сильная душевная боль.', tone: 'sad', intent: 'выразить боль' },
  { pattern: /😂\s*💀|💀\s*😂|🤣\s*💀/, meaning: '«Умер» от смеха. Очень смешно.', tone: 'happy', intent: 'показать сильный смех' },
  { pattern: /🥺\s*👉👈/, meaning: 'Умоляющий + стеснение. «Ну пожалуйста…» в милой форме.', tone: 'shy', intent: 'попросить мило' },
  { pattern: /😳\s*👉👈/, meaning: 'Смущение + стеснение.', tone: 'shy', intent: 'выразить смущение' },
  { pattern: /😍\s*❤|❤\s*😍|🥰\s*❤/, meaning: 'Сильная влюблённость / умиление.', tone: 'love', intent: 'выразить нежность' },
  { pattern: /🫠\s*🔥|🔥\s*🫠/, meaning: 'Таю от жара / от чувств / от стыда.', tone: 'flirt', intent: 'показать сильную реакцию' },
  { pattern: /🤡\s*💀|💀\s*🤡/, meaning: '«Клоун» + смерть. Сильная насмешка.', tone: 'sarcasm', intent: 'высмеять' },
  { pattern: /☠️\s*😂|😂\s*☠️/, meaning: 'Мрачный смех / «умер».', tone: 'playful', intent: 'показать реакцию' },
  { pattern: /🙏\s*😭|😭\s*🙏/, meaning: 'Мольба + слёзы. Сильная просьба или благодарность.', tone: 'sad', intent: 'умолять / благодарить' },

  // Другие популярные
  { pattern: /👍\s*🔥|🔥\s*👍/, meaning: 'Очень круто, одобряю на максимум.', tone: 'happy', intent: 'похвалить' },
  { pattern: /💯\s*🔥|🔥\s*💯/, meaning: 'Идеально + горячо.', tone: 'happy', intent: 'выразить восторг' },
  { pattern: /🌹\s*❤|❤\s*🌹/, meaning: 'Классическая романтика.', tone: 'love', intent: 'показать романтику' },
  { pattern: /🥀\s*💔|💔\s*🥀/, meaning: 'Увядшая любовь, разочарование.', tone: 'sad', intent: 'выразить разочарование' },
  { pattern: /👀\s*👄|👄\s*👀/, meaning: 'Смотрю на губы / хочу поцеловать / намёк.', tone: 'flirt', intent: 'пофлиртовать' },
  { pattern: /😈\s*🔥|🔥\s*😈/, meaning: 'Дьявольски горячо / соблазнительно.', tone: 'sexual', intent: 'соблазнять' },
  { pattern: /🥵\s*🍆|🍆\s*🥵/, meaning: 'Сильно возбуждён (про член).', tone: 'sexual', intent: 'эротический намёк' },
  { pattern: /😳\s*💦|💦\s*😳/, meaning: 'Смущён до «финиша» / очень смущён.', tone: 'shy', intent: 'выразить смущение' },
];

/* ===================== ОСНОВНЫЕ ПРАВИЛА ===================== */

const RULES = [
  // Пустые / точки
  {
    test: (t) => JUNK.test(t),
    result: {
      meaning: 'Это не сообщение, а точка или пробел. Скорее всего проверяет реакцию или не знает, что сказать.',
      tone: 'spam',
      intent: 'привлечь внимание',
      replies: [
        { style: 'friendly', text: 'Точка — это всё? Давай по-нормальному 😄' },
        { style: 'flirty', text: 'Одна точка, а уже интригует. Что дальше?' },
        { style: 'cold', text: 'Напиши, когда будет что сказать.' }
      ]
    }
  },

  // Чистые эмодзи или почти только эмодзи
  {
    test: (t) => /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}\s]+$/u.test(t) && t.replace(/\s/g, '').length > 0,
    result: null // обработаем отдельно в analyzeEmojis
  },

  // Короткие согласия / отказы
  {
    test: (t) => /^(ок|окей|ok|okay|угу|ага|ясно|понятно|ладно|хорошо)$/i.test(t.trim()),
    result: {
      meaning: 'Короткое согласие. Может быть как вежливым, так и прохладным — зависит от контекста.',
      tone: 'dry',
      intent: 'закрыть тему или согласиться',
      replies: [
        { style: 'friendly', text: 'Хорошо! Тогда так и сделаем.' },
        { style: 'flirty', text: '«Ок» — это да или «ок» — это отстань? 😏' },
        { style: 'cold', text: 'Принято.' }
      ]
    }
  },
  {
    test: (t) => /^(да|даа|дааа|yes|yeah)$/i.test(t.trim()) && t.length < 8,
    result: {
      meaning: 'Короткое «да». Может быть энтузиазмом или просто согласием.',
      tone: 'neutral',
      intent: 'подтвердить',
      replies: [
        { style: 'friendly', text: 'Отлично 👍' },
        { style: 'flirty', text: 'Нравится, когда ты так уверенно соглашаешься 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t) => /^(нет|не|неа|no|nope)$/i.test(t.trim()) && t.length < 8,
    result: {
      meaning: 'Короткий отказ.',
      tone: 'dry',
      intent: 'отказать',
      replies: [
        { style: 'friendly', text: 'Понял, без проблем.' },
        { style: 'flirty', text: 'Ой, сразу «нет»? Жёстко 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Смех
  {
    test: (t, lower) => /(ха)+|ахах|лол|кек|ржу|😂|🤣|хех|хихи|ржунимагу/i.test(lower),
    result: {
      meaning: 'Смеётся. Настроение хорошее, диалог идёт легко.',
      tone: 'happy',
      intent: 'поддержать весёлый тон',
      replies: [
        { style: 'friendly', text: 'Рад, что зашло 😄' },
        { style: 'flirty', text: 'Смеёшься — значит нравлюсь 😏' },
        { style: 'cold', text: 'Понятно.' }
      ]
    }
  },

  // Позитив
  {
    test: (t, lower) => /круто|класс|огонь|супер|вау|офигеть|кайф|топ|🔥|👍|💯/i.test(lower),
    result: {
      meaning: 'Положительная реакция. Человеку нравится.',
      tone: 'happy',
      intent: 'выразить одобрение',
      replies: [
        { style: 'friendly', text: 'Рад, что понравилось 😊' },
        { style: 'flirty', text: 'Нравится, когда ты так реагируешь 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Местоположение / время
  {
    test: (t, lower) => /ты\s+где|где\s+ты|где\s+сейчас|ты\s+дома|ты\s+на\s+работе/i.test(lower),
    result: {
      meaning: 'Уточняет твоё местоположение.',
      tone: 'neutral',
      intent: 'скоординироваться',
      replies: [
        { style: 'friendly', text: 'Сейчас дома / в пути. А ты?' },
        { style: 'flirty', text: 'Соскучился? 😏 Я уже почти.' },
        { style: 'cold', text: 'Дома.' }
      ]
    }
  },
  {
    test: (t, lower) => /через\s+сколько|когда\s+придёшь|когда\s+будешь|когда\s+приедешь|во\s+сколько/i.test(lower),
    result: {
      meaning: 'Спрашивает время твоего появления.',
      tone: 'neutral',
      intent: 'скоординироваться',
      replies: [
        { style: 'friendly', text: 'Скоро буду, напишу как выйду.' },
        { style: 'flirty', text: 'Соскучился? 😏 Я уже в пути.' },
        { style: 'cold', text: 'Буду — напишу.' }
      ]
    }
  },
  {
    test: (t, lower) => /ты\s+занят|ты\s+свободен|можешь\s+говорить|есть\s+время|не\s+мешаю/i.test(lower),
    result: {
      meaning: 'Проверяет, свободен ли ты для разговора.',
      tone: 'neutral',
      intent: 'проверить доступность',
      replies: [
        { style: 'friendly', text: 'Да, свободен. Что случилось?' },
        { style: 'flirty', text: 'Для тебя всегда найду время 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // Удивление
  {
    test: (t, lower) => /ты\s+кто|что\s+за|какого|серьёзно|да\s+ладно|не\s+может\s+быть|в\s+смысле/i.test(lower),
    result: {
      meaning: 'Удивляется или сомневается. Ждёт пояснения.',
      tone: 'sarcasm',
      intent: 'проверить серьёзность',
      replies: [
        { style: 'friendly', text: 'Ага, серьёзно. Сейчас объясню.' },
        { style: 'flirty', text: 'Заинтриговал? 😏' },
        { style: 'cold', text: 'Именно так.' }
      ]
    }
  },
  {
    test: (t, lower) => /правда\?|серьёзно\?|реально\?|в\s+натуре\?/i.test(lower),
    result: {
      meaning: 'Просит подтверждения. Не уверен, шутишь ты или нет.',
      tone: 'curious',
      intent: 'уточнить',
      replies: [
        { style: 'friendly', text: 'Да, правда. Без шуток.' },
        { style: 'flirty', text: 'А ты сомневаешься? 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // Приветствия
  {
    test: (t) => /^(привет|прив|хай|hello|hi|здарова|здаров|здорово|доброе\s+утро|добрый\s+день|добрый\s+вечер)$/i.test(t.trim()),
    result: {
      meaning: 'Простое приветствие. Хочет начать общение.',
      tone: 'friendly',
      intent: 'поздороваться',
      replies: [
        { style: 'friendly', text: 'Привет! Как дела?' },
        { style: 'flirty', text: 'Привет 😏 Уже соскучился?' },
        { style: 'cold', text: 'Привет.' }
      ]
    }
  },
  {
    test: (t, lower) => /как\s+дела|как\s+ты|как\s+жизнь|что\s+нового|как\s+настроение/i.test(lower),
    result: {
      meaning: 'Интересуется твоим состоянием.',
      tone: 'friendly',
      intent: 'узнать о тебе',
      replies: [
        { style: 'friendly', text: 'Нормально, спасибо. А у тебя как?' },
        { style: 'flirty', text: 'Лучше, когда ты пишешь 😏 А ты как?' },
        { style: 'cold', text: 'Норм.' }
      ]
    }
  },
  {
    test: (t, lower) => /что\s+делаешь|чем\s+занимаешься|что\s+сейчас\s+делаешь/i.test(lower),
    result: {
      meaning: 'Спрашивает, чем ты сейчас занят.',
      tone: 'curious',
      intent: 'узнать о твоих делах',
      replies: [
        { style: 'friendly', text: 'Сейчас вот с тобой переписываюсь 😄 А ты?' },
        { style: 'flirty', text: 'Думаю о тебе 😏 А ты чем?' },
        { style: 'cold', text: 'Ничем.' }
      ]
    }
  },

  // Комплименты / флирт
  {
    test: (t, lower) => /красив|симпатичн|мил|очаровательн|секси|горяч|сексуальн|прекрасн/i.test(lower),
    result: {
      meaning: 'Делает комплимент. Флиртует или хочет поднять настроение.',
      tone: 'flirt',
      intent: 'польстить / пофлиртовать',
      replies: [
        { style: 'friendly', text: 'Спасибо 😊 Приятно слышать.' },
        { style: 'flirty', text: 'Знаю 😏 А ты ещё лучше.' },
        { style: 'cold', text: 'Спасибо.' }
      ]
    }
  },
  {
    test: (t, lower) => /скучаю|соскучил|хочу\s+увидеть|хочу\s+тебя|когда\s+увидимся/i.test(lower),
    result: {
      meaning: 'Скучает или хочет встречи. Эмоционально вовлечён.',
      tone: 'flirt',
      intent: 'показать интерес / желание встретиться',
      replies: [
        { style: 'friendly', text: 'Я тоже. Давай скоро увидимся.' },
        { style: 'flirty', text: 'Соскучился? 😏 Я тоже очень.' },
        { style: 'cold', text: 'Скоро.' }
      ]
    }
  },
  {
    test: (t, lower) => /люблю\s+тебя|я\s+тебя\s+люблю|ты\s+мне\s+нравишься/i.test(lower),
    result: {
      meaning: 'Признание в чувствах. Серьёзный эмоциональный шаг.',
      tone: 'love',
      intent: 'признаться',
      replies: [
        { style: 'friendly', text: 'Это очень важно. Давай поговорим об этом.' },
        { style: 'flirty', text: 'И я тебя 😏' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },

  // Негатив
  {
    test: (t, lower) => /бесит|достал|надоел|отстань|отвали|заткнись|иди\s+нахуй|пошёл\s+нахуй/i.test(lower),
    result: {
      meaning: 'Выражает раздражение или агрессию.',
      tone: 'angry',
      intent: 'выразить недовольство',
      replies: [
        { style: 'friendly', text: 'Понял, извини. Не хотел задеть.' },
        { style: 'flirty', text: 'Ого, как резко 😏 Что случилось?' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /я\s+злюсь|я\s+обидел|мне\s+обидно|ты\s+обидел/i.test(lower),
    result: {
      meaning: 'Говорит о негативных чувствах. Хочет, чтобы ты заметил.',
      tone: 'angry',
      intent: 'выразить обиду',
      replies: [
        { style: 'friendly', text: 'Мне жаль, что так вышло. Давай разберёмся.' },
        { style: 'flirty', text: 'Не хочу, чтобы ты злился 😏 Расскажи, что не так.' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },
  {
    test: (t, lower) => /устал|устала|заебал|заебала|нет\s+сил|выгорел/i.test(lower),
    result: {
      meaning: 'Жалуется на усталость. Нуждается в поддержке.',
      tone: 'tired',
      intent: 'пожаловаться / попросить поддержки',
      replies: [
        { style: 'friendly', text: 'Отдыхай. Не надо себя изматывать.' },
        { style: 'flirty', text: 'Давай я тебя отвлеку 😏' },
        { style: 'cold', text: 'Отдыхай.' }
      ]
    }
  },
  {
    test: (t, lower) => /грустно|плохо|тоскливо|депресс|хочу\s+плакать/i.test(lower),
    result: {
      meaning: 'Плохое настроение или грусть. Нуждается в поддержке.',
      tone: 'sad',
      intent: 'поделиться чувствами',
      replies: [
        { style: 'friendly', text: 'Я рядом. Хочешь поговорить об этом?' },
        { style: 'flirty', text: 'Давай я тебя подниму настроение 😏' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },
  {
    test: (t, lower) => /одиноко|мне\s+одиноко|никто\s+не\s+пишет/i.test(lower),
    result: {
      meaning: 'Чувствует одиночество. Ищет внимания.',
      tone: 'sad',
      intent: 'получить внимание',
      replies: [
        { style: 'friendly', text: 'Я здесь. Можешь писать, когда захочешь.' },
        { style: 'flirty', text: 'Тогда я точно не дам тебе скучать 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Планы
  {
    test: (t, lower) => /давай\s+встретимся|хочешь\s+встретиться|когда\s+увидимся|давай\s+сходим/i.test(lower),
    result: {
      meaning: 'Предлагает встречу. Проявляет инициативу.',
      tone: 'flirt',
      intent: 'договориться о встрече',
      replies: [
        { style: 'friendly', text: 'Давай. Когда тебе удобно?' },
        { style: 'flirty', text: 'Уже давно жду этого предложения 😏' },
        { style: 'cold', text: 'Может быть.' }
      ]
    }
  },
  {
    test: (t, lower) => /что\s+будешь\s+делать|какие\s+планы|на\s+выходных|в\s+субботу|в\s+воскресенье/i.test(lower),
    result: {
      meaning: 'Спрашивает о планах. Возможно, хочет что-то предложить.',
      tone: 'curious',
      intent: 'узнать планы',
      replies: [
        { style: 'friendly', text: 'Пока без особых планов. А у тебя?' },
        { style: 'flirty', text: 'Зависит от того, предложишь ли ты что-то интересное 😏' },
        { style: 'cold', text: 'Ничего.' }
      ]
    }
  },

  // Сон
  {
    test: (t, lower) => /спать|ложись|спокойной\s+ночи|доброй\s+ночи|я\s+сплю|уже\s+сплю/i.test(lower),
    result: {
      meaning: 'Говорит о сне или желании спать. Возможно, заканчивает разговор.',
      tone: 'tired',
      intent: 'завершить / сообщить о сне',
      replies: [
        { style: 'friendly', text: 'Спокойной ночи. Высыпайся.' },
        { style: 'flirty', text: 'Сладких снов… и чтобы я тебе приснился 😏' },
        { style: 'cold', text: 'Спокойной.' }
      ]
    }
  },

  // Извинения / благодарность
  {
    test: (t, lower) => /извини|прости|сорян|сорри|моя\s+вина/i.test(lower),
    result: {
      meaning: 'Извиняется. Признаёт ошибку.',
      tone: 'shy',
      intent: 'извиниться',
      replies: [
        { style: 'friendly', text: 'Ничего страшного. Всё нормально.' },
        { style: 'flirty', text: 'Прощаю… но только если поцелуешь 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /спасибо|благодарю|спс|thx|thanks/i.test(lower),
    result: {
      meaning: 'Благодарит.',
      tone: 'friendly',
      intent: 'поблагодарить',
      replies: [
        { style: 'friendly', text: 'Пожалуйста 😊' },
        { style: 'flirty', text: 'Для тебя — всегда 😏' },
        { style: 'cold', text: 'Не за что.' }
      ]
    }
  },

  // Почему молчишь
  {
    test: (t, lower) => /почему\s+молчишь|ты\s+где\s+пропал|куда\s+пропал|долго\s+не\s+писал|не\s+отвечаешь/i.test(lower),
    result: {
      meaning: 'Замечает твоё молчание. Хочет вернуть внимание.',
      tone: 'curious',
      intent: 'вернуть в диалог',
      replies: [
        { style: 'friendly', text: 'Извини, отвлёкся. Сейчас здесь.' },
        { style: 'flirty', text: 'Скучал? 😏 Я вернулся.' },
        { style: 'cold', text: 'Был занят.' }
      ]
    }
  },

  // Хватит
  {
    test: (t, lower) => /хватит|достаточно|стоп|остановись|перестань/i.test(lower),
    result: {
      meaning: 'Просит остановиться.',
      tone: 'angry',
      intent: 'остановить',
      replies: [
        { style: 'friendly', text: 'Ок, останавливаюсь.' },
        { style: 'flirty', text: 'Уже? А мне только разогрелся 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Не знаю / может быть / потом
  {
    test: (t, lower) => /не\s+знаю|хз|без\s+понятия/i.test(lower),
    result: {
      meaning: 'Говорит, что не знает.',
      tone: 'dry',
      intent: 'уклониться / признать незнание',
      replies: [
        { style: 'friendly', text: 'Ничего страшного. Разберёмся.' },
        { style: 'flirty', text: 'Тогда давай вместе придумаем 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /может\s+быть|возможно|наверное|не\s+уверен/i.test(lower),
    result: {
      meaning: 'Неопределённый ответ. Не хочет брать обязательства.',
      tone: 'dry',
      intent: 'оставить пространство',
      replies: [
        { style: 'friendly', text: 'Хорошо, тогда решим позже.' },
        { style: 'flirty', text: '«Может быть» — это почти «да» 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /потом|позже|не\s+сейчас|в\s+другой\s+раз/i.test(lower),
    result: {
      meaning: 'Откладывает. Не готов сейчас.',
      tone: 'dry',
      intent: 'отложить',
      replies: [
        { style: 'friendly', text: 'Хорошо, как скажешь.' },
        { style: 'flirty', text: 'Буду ждать 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Статусы
  {
    test: (t, lower) => /я\s+дома|уже\s+дома|приехал|приехала|на\s+месте/i.test(lower),
    result: {
      meaning: 'Сообщает, что дома / на месте.',
      tone: 'neutral',
      intent: 'сообщить статус',
      replies: [
        { style: 'friendly', text: 'Отлично. Отдыхай.' },
        { style: 'flirty', text: 'Наконец-то. Я соскучился 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /выхожу|уже\s+выхожу|скоро\s+буду|в\s+пути/i.test(lower),
    result: {
      meaning: 'Сообщает, что выходит / в пути.',
      tone: 'neutral',
      intent: 'сообщить статус',
      replies: [
        { style: 'friendly', text: 'Жду.' },
        { style: 'flirty', text: 'Уже жду не дождусь 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /задерживаюсь|опоздаю|буду\s+позже/i.test(lower),
    result: {
      meaning: 'Предупреждает об опоздании.',
      tone: 'neutral',
      intent: 'предупредить',
      replies: [
        { style: 'friendly', text: 'Хорошо, не торопись.' },
        { style: 'flirty', text: 'Главное — приходи 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /я\s+занят|я\s+занята|сейчас\s+не\s+могу|нет\s+времени/i.test(lower),
    result: {
      meaning: 'Сообщает о занятости.',
      tone: 'dry',
      intent: 'отложить общение',
      replies: [
        { style: 'friendly', text: 'Хорошо, напиши когда освободишься.' },
        { style: 'flirty', text: 'Жду, когда освободишься 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
];

/* ===================== ФУНКЦИИ АНАЛИЗА ===================== */

function analyzeEmojis(text) {
  const cleaned = text.replace(/\s+/g, '');
  const found = [];
  const explanations = [];

  // Сначала проверяем комбо (более специфичные)
  for (const combo of EMOJI_COMBOS) {
    if (combo.pattern.test(text)) {
      return {
        meaning: `Эмодзи-комбинация: ${combo.meaning}`,
        tone: combo.tone,
        intent: combo.intent,
        replies: [
          { style: 'friendly', text: 'Понял тебя 😄' },
          { style: 'flirty', text: 'Ого, какие намёки 😏' },
          { style: 'cold', text: 'Ясно.' }
        ]
      };
    }
  }

  // Потом одиночные
  for (const [emoji, meaning] of Object.entries(EMOJI_MEANINGS)) {
    if (text.includes(emoji)) {
      found.push(emoji);
      explanations.push(`${emoji} — ${meaning}`);
    }
  }

  if (explanations.length === 0) {
    return {
      meaning: 'Эмодзи без явного сленгового значения (или редкое). Скорее просто реакция.',
      tone: 'playful',
      intent: 'выразить эмоцию',
      replies: [
        { style: 'friendly', text: '😄 Понял.' },
        { style: 'flirty', text: 'Нравится твой язык эмодзи 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    };
  }

  const uniqueExpl = [...new Set(explanations)];
  const meaningText = 'Расшифровка эмодзи:\n' + uniqueExpl.join('\n');

  // Определяем общий тон
  let tone = 'playful';
  if (found.some(e => ['🍆','🍑','💦','👅','👉👌'].includes(e) || text.includes('👉') && text.includes('👌'))) tone = 'sexual';
  else if (found.some(e => ['❤','❤️','💕','💖','💘','😍','🥰','😘'].includes(e))) tone = 'love';
  else if (found.some(e => ['☠️','💀','🔪','💔','😢','😭'].includes(e))) tone = 'sad';
  else if (found.some(e => ['🔥','🥵','😈','😏'].includes(e))) tone = 'flirt';

  return {
    meaning: meaningText,
    tone,
    intent: 'выразить эмоцию / сделать намёк',
    replies: [
      { style: 'friendly', text: 'Понял реакцию 👍' },
      { style: 'flirty', text: 'Красиво подобрано 😏' },
      { style: 'cold', text: 'Ок.' }
    ]
  };
}

function localAnalyze(text) {
  const t = text.trim();
  if (!t) {
    return {
      meaning: 'Пустое сообщение.',
      tone: 'spam',
      intent: 'ничего',
      replies: [
        { style: 'friendly', text: 'Напиши что-нибудь 😄' },
        { style: 'flirty', text: 'Молчишь? Интригуешь 😏' },
        { style: 'cold', text: '...' }
      ]
    };
  }

  const lower = t.toLowerCase();

  // 1. Эмодзи-only или почти only
  const emojiOnly = /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}\s\u200d️‍]+$/u.test(t);
  if (emojiOnly) {
    return analyzeEmojis(t);
  }

  // 2. Если много эмодзи + текст — тоже даём расшифровку + обычный анализ
  const hasEmojis = /[\p{Emoji}\p{Emoji_Presentation}]/u.test(t);

  // 3. Основные правила
  for (const rule of RULES) {
    if (rule.test(t, lower)) {
      if (rule.result === null) continue; // эмодзи-правило пропускаем
      // Если есть эмодзи — дополняем meaning
      if (hasEmojis) {
        const emojiPart = analyzeEmojis(t);
        return {
          ...rule.result,
          meaning: rule.result.meaning + '\n\n' + emojiPart.meaning
        };
      }
      return rule.result;
    }
  }

  // 4. Если просто есть эмодзи, но текст не попал под правила
  if (hasEmojis) {
    return analyzeEmojis(t);
  }

  // Дефолт
  return {
    meaning: 'Обычное сообщение без явных маркеров. Смысл зависит от предыдущего диалога.',
    tone: 'neutral',
    intent: 'продолжить разговор',
    replies: [
      { style: 'friendly', text: 'Понял тебя. Расскажи подробнее?' },
      { style: 'flirty', text: 'Интересно. И что дальше? 😏' },
      { style: 'cold', text: 'Ясно.' }
    ]
  };
}

function render(data) {
  $('meaning').textContent = data.meaning;
  $('tone').textContent = TONES[data.tone] || data.tone;
  $('intent').textContent = data.intent;

  const box = $('replies');
  box.innerHTML = '';

  data.replies.forEach((r) => {
    const el = document.createElement('div');
    el.className = 'reply';

    const left = document.createElement('div');
    left.className = 'reply-text';

    const style = document.createElement('span');
    style.className = 'reply-style';
    style.textContent = STYLES[r.style] || r.style;

    const txt = document.createElement('span');
    txt.textContent = r.text;

    left.append(style, txt);

    const btn = document.createElement('button');
    btn.className = 'copy';
    btn.textContent = 'копировать';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(r.text).then(() => {
        btn.textContent = 'скопировано';
        setTimeout(() => (btn.textContent = 'копировать'), 1200);
      }).catch(() => {
        btn.textContent = 'ошибка';
        setTimeout(() => (btn.textContent = 'копировать'), 1200);
      });
    });

    el.append(left, btn);
    box.append(el);
  });

  $('result').classList.remove('hidden');
}

function analyze() {
  const text = $('input').value;
  if (!text.trim()) {
    $('input').focus();
    return;
  }

  $('analyze').disabled = true;
  $('analyze').textContent = 'Разбираю...';

  setTimeout(() => {
    try {
      const data = localAnalyze(text);
      render(data);
    } catch (err) {
      console.error(err);
      render({
        meaning: 'Ошибка анализа. Попробуй ещё раз.',
        tone: 'neutral',
        intent: 'ошибка',
        replies: [
          { style: 'friendly', text: 'Что-то пошло не так 😅' },
          { style: 'flirty', text: 'Даже я иногда ошибаюсь 😏' },
          { style: 'cold', text: 'Ошибка.' }
        ]
      });
    }
    $('analyze').disabled = false;
    $('analyze').textContent = 'Разобрать';
  }, 150);
}
