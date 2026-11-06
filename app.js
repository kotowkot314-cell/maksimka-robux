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
  playful: 'игривость'
};

const STYLES = {
  friendly: 'дружелюбно',
  flirty: 'с флиртом',
  cold: 'сдержанно'
};

// Большой массив правил. Порядок важен — более специфичные выше.
const RULES = [
  // === Пустые / точки / мусор ===
  {
    test: (t, lower) => JUNK.test(t),
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
  {
    test: (t, lower) => /^(ок|окей|ok|okay|угу|ага|ясно|понятно|ладно|хорошо|хорошоо|хорошооо)$/i.test(t.trim()),
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
    test: (t, lower) => /^(да|даа|дааа|yes|yeah|ага|угу)$/i.test(t.trim()) && t.length < 8,
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
    test: (t, lower) => /^(нет|не|неа|no|nope)$/i.test(t.trim()) && t.length < 8,
    result: {
      meaning: 'Короткий отказ. Тон зависит от контекста — может быть мягким или жёстким.',
      tone: 'dry',
      intent: 'отказать',
      replies: [
        { style: 'friendly', text: 'Понял, без проблем.' },
        { style: 'flirty', text: 'Ой, сразу «нет»? Жёстко 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === Смех / позитив ===
  {
    test: (t, lower) => /(ха)+|ахах|лол|кек|ржу|😂|🤣|хех|хихи|ржунимагу/i.test(lower),
    result: {
      meaning: 'Смеётся над чем-то. Настроение хорошее, диалог идёт легко.',
      tone: 'flirt',
      intent: 'поддержать весёлый тон',
      replies: [
        { style: 'friendly', text: 'Рад, что зашло 😄' },
        { style: 'flirty', text: 'Смеёшься — значит нравлюсь 😏' },
        { style: 'cold', text: 'Понятно.' }
      ]
    }
  },
  {
    test: (t, lower) => /круто|класс|огонь|супер|вау|офигеть|ого|огого|кайф|топ|🔥|👍|💯/i.test(lower),
    result: {
      meaning: 'Положительная реакция. Человеку нравится то, что ты написал/показал.',
      tone: 'happy',
      intent: 'выразить одобрение',
      replies: [
        { style: 'friendly', text: 'Рад, что понравилось 😊' },
        { style: 'flirty', text: 'Нравится, когда ты так реагируешь 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /скучно|нудно|неинтересно|фигня|бред|ерунда/i.test(lower),
    result: {
      meaning: 'Выражает скуку или разочарование. Возможно, хочет сменить тему.',
      tone: 'dry',
      intent: 'пожаловаться / сменить тему',
      replies: [
        { style: 'friendly', text: 'Тогда давай о чём-то другом. Что тебе интересно?' },
        { style: 'flirty', text: 'Скучно? Тогда давай сделаем интереснее 😏' },
        { style: 'cold', text: 'Как скажешь.' }
      ]
    }
  },

  // === Вопросы о местоположении / времени ===
  {
    test: (t, lower) => /ты\s+где|где\s+ты|где\s+сейчас|ты\s+дома|ты\s+на\s+работе|ты\s+уже\s+дома/i.test(lower),
    result: {
      meaning: 'Уточняет твоё местоположение. Хочет понять, где ты сейчас.',
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
    test: (t, lower) => /через\s+сколько|когда\s+придёшь|когда\s+будешь|когда\s+приедешь|во\s+сколько|к\s+какому\s+времени/i.test(lower),
    result: {
      meaning: 'Спрашивает время твоего появления. Хочет спланировать.',
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
      meaning: 'Проверяет, свободен ли ты для разговора. Вежливо уточняет.',
      tone: 'neutral',
      intent: 'проверить доступность',
      replies: [
        { style: 'friendly', text: 'Да, свободен. Что случилось?' },
        { style: 'flirty', text: 'Для тебя всегда найду время 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // === Удивление / сомнение ===
  {
    test: (t, lower) => /ты\s+кто|что\s+за|какого|серьёзно|да\s+ладно|не\s+может\s+быть|в\s+смысле|что\s+ты\s+имеешь\s+в\s+виду/i.test(lower),
    result: {
      meaning: 'Удивляется или сомневается в том, что ты написал. Возможно, ждёт пояснения.',
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
    test: (t, lower) => /правда\?|серьёзно\?|реально\?|в\s+натуре\?|без\s+шуток\?/i.test(lower),
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

  // === Приветствия ===
  {
    test: (t, lower) => /^(привет|прив|хай|hello|hi|здарова|здаров|здорово|доброе\s+утро|добрый\s+день|добрый\s+вечер|доброй\s+ночи)$/i.test(t.trim()),
    result: {
      meaning: 'Простое приветствие. Хочет начать или продолжить общение.',
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
    test: (t, lower) => /как\s+дела|как\s+ты|как\s+жизнь|что\s+нового|как\s+настроение|как\s+сам/i.test(lower),
    result: {
      meaning: 'Интересуется твоим состоянием. Классический способ поддержать разговор.',
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
    test: (t, lower) => /что\s+делаешь|чем\s+занимаешься|ты\s+занят\s+сейчас|что\s+сейчас\s+делаешь/i.test(lower),
    result: {
      meaning: 'Спрашивает, чем ты сейчас занят. Хочет понять контекст или просто поболтать.',
      tone: 'curious',
      intent: 'узнать о твоих делах',
      replies: [
        { style: 'friendly', text: 'Сейчас вот с тобой переписываюсь 😄 А ты?' },
        { style: 'flirty', text: 'Думаю о тебе 😏 А ты чем?' },
        { style: 'cold', text: 'Ничем.' }
      ]
    }
  },

  // === Комплименты / флирт ===
  {
    test: (t, lower) => /красив|симпатичн|мил|очаровательн|секси|горяч|сексуальн|прекрасн|лучш/i.test(lower),
    result: {
      meaning: 'Делает комплимент. Флиртует или просто хочет поднять настроение.',
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
      meaning: 'Выражает, что скучает или хочет встречи. Эмоционально вовлечён.',
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
    test: (t, lower) => /люблю\s+тебя|я\s+тебя\s+люблю|ты\s+мне\s+нравишься|я\s+в\s+тебе\s+влюбл/i.test(lower),
    result: {
      meaning: 'Признание в чувствах. Серьёзный эмоциональный шаг.',
      tone: 'flirt',
      intent: 'признаться',
      replies: [
        { style: 'friendly', text: 'Это очень важно. Давай поговорим об этом.' },
        { style: 'flirty', text: 'И я тебя 😏' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },

  // === Негатив / злость ===
  {
    test: (t, lower) => /бесит|достал|надоел|отстань|отвали|заткнись|заткни|иди\s+нахуй|пошёл\s+нахуй|пошла\s+нахуй/i.test(lower),
    result: {
      meaning: 'Выражает раздражение или агрессию. Хочет, чтобы ты отстал или изменил поведение.',
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
    test: (t, lower) => /я\s+злюсь|я\s+обидел|мне\s+обидно|ты\s+обидел|почему\s+ты\s+так/i.test(lower),
    result: {
      meaning: 'Говорит о своих негативных чувствах. Хочет, чтобы ты это заметил и отреагировал.',
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
    test: (t, lower) => /устал|устала|заебал|заебала|нет\s+сил|выгорел|выгорела/i.test(lower),
    result: {
      meaning: 'Жалуется на усталость. Нуждается в поддержке или просто выговориться.',
      tone: 'tired',
      intent: 'пожаловаться / попросить поддержки',
      replies: [
        { style: 'friendly', text: 'Отдыхай. Не надо себя изматывать.' },
        { style: 'flirty', text: 'Давай я тебя отвлеку 😏' },
        { style: 'cold', text: 'Отдыхай.' }
      ]
    }
  },

  // === Грусть / плохое настроение ===
  {
    test: (t, lower) => /грустно|плохо|тоскливо|депресс|не\s+хочу\s+жить|хочу\s+плакать|слёзы/i.test(lower),
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
    test: (t, lower) => /одиноко|мне\s+одиноко|никто\s+не\s+пишет|все\s+заняты/i.test(lower),
    result: {
      meaning: 'Чувствует одиночество. Ищет внимания и общения.',
      tone: 'sad',
      intent: 'получить внимание',
      replies: [
        { style: 'friendly', text: 'Я здесь. Можешь писать, когда захочешь.' },
        { style: 'flirty', text: 'Тогда я точно не дам тебе скучать 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === Планы / предложения ===
  {
    test: (t, lower) => /давай\s+встретимся|хочешь\s+встретиться|когда\s+увидимся|давай\s+сходим|пошли\s+куда/i.test(lower),
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
      meaning: 'Спрашивает о планах. Возможно, хочет что-то предложить или просто узнать.',
      tone: 'curious',
      intent: 'узнать планы',
      replies: [
        { style: 'friendly', text: 'Пока без особых планов. А у тебя?' },
        { style: 'flirty', text: 'Зависит от того, предложишь ли ты что-то интересное 😏' },
        { style: 'cold', text: 'Ничего.' }
      ]
    }
  },
  {
    test: (t, lower) => /кино|фильм|сериал|посмотреть|посмотрел|посмотрела/i.test(lower),
    result: {
      meaning: 'Говорит о кино/сериалах. Хочет обсудить или предложить совместный просмотр.',
      tone: 'neutral',
      intent: 'обсудить развлечения',
      replies: [
        { style: 'friendly', text: 'Что смотришь? Порекомендуй что-нибудь.' },
        { style: 'flirty', text: 'Давай вместе посмотрим 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === Работа / учёба ===
  {
    test: (t, lower) => /работа|на\s+работе|начальник|коллеги|офис|зарплата/i.test(lower),
    result: {
      meaning: 'Говорит о работе. Может жаловаться или просто делиться новостями.',
      tone: 'neutral',
      intent: 'поделиться / пожаловаться',
      replies: [
        { style: 'friendly', text: 'Как там у тебя на работе?' },
        { style: 'flirty', text: 'Работать — это хорошо, но отдыхать с тобой лучше 😏' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },
  {
    test: (t, lower) => /учёба|универ|институт|экзамен|зачёт|сессия|препод/i.test(lower),
    result: {
      meaning: 'Тема учёбы. Часто связана со стрессом или новостями.',
      tone: 'neutral',
      intent: 'поделиться / пожаловаться',
      replies: [
        { style: 'friendly', text: 'Как учёба? Сильно загружен?' },
        { style: 'flirty', text: 'Учись, а потом расскажешь, как прошёл день 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === Еда ===
  {
    test: (t, lower) => /есть|голоден|голодная|поесть|завтрак|обед|ужин|пицца|суши|бургер/i.test(lower),
    result: {
      meaning: 'Говорит о еде. Может быть просто разговором или намёком на совместный приём пищи.',
      tone: 'neutral',
      intent: 'поговорить о еде / предложить',
      replies: [
        { style: 'friendly', text: 'Что ешь? Я вот тоже проголодался.' },
        { style: 'flirty', text: 'Давай вместе что-нибудь вкусное 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === Погода ===
  {
    test: (t, lower) => /погода|дождь|снег|холодно|жарко|ветер|тучи/i.test(lower),
    result: {
      meaning: 'Говорит о погоде. Классический способ начать или поддержать разговор.',
      tone: 'neutral',
      intent: 'поддержать разговор',
      replies: [
        { style: 'friendly', text: 'Да, погода сегодня странная. У тебя как?' },
        { style: 'flirty', text: 'В такую погоду лучше оставаться дома… со мной 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // === Сон ===
  {
    test: (t, lower) => /спать|устал|ложись|спокойной\s+ночи|доброй\s+ночи|я\s+сплю|уже\s+сплю/i.test(lower),
    result: {
      meaning: 'Говорит о сне или желании спать. Возможно, заканчивает разговор на сегодня.',
      tone: 'tired',
      intent: 'завершить / сообщить о сне',
      replies: [
        { style: 'friendly', text: 'Спокойной ночи. Высыпайся.' },
        { style: 'flirty', text: 'Сладких снов… и чтобы я тебе приснился 😏' },
        { style: 'cold', text: 'Спокойной.' }
      ]
    }
  },

  // === Фото / медиа ===
  {
    test: (t, lower) => /фото|фотка|селфи|видео|отправь|скинь|покажи/i.test(lower),
    result: {
      meaning: 'Просит или предлагает медиа. Хочет визуального контакта.',
      tone: 'curious',
      intent: 'получить / отправить контент',
      replies: [
        { style: 'friendly', text: 'Сейчас гляну / скину.' },
        { style: 'flirty', text: 'Только если ты тоже 😏' },
        { style: 'cold', text: 'Позже.' }
      ]
    }
  },

  // === Извинения ===
  {
    test: (t, lower) => /извини|прости|сорян|сорри|моя\s+вина|я\s+виноват|я\s+виновата/i.test(lower),
    result: {
      meaning: 'Извиняется. Признаёт ошибку или неловкость.',
      tone: 'shy',
      intent: 'извиниться',
      replies: [
        { style: 'friendly', text: 'Ничего страшного. Всё нормально.' },
        { style: 'flirty', text: 'Прощаю… но только если поцелуешь 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === Благодарность ===
  {
    test: (t, lower) => /спасибо|благодарю|благодарность|спс|thx|thanks/i.test(lower),
    result: {
      meaning: 'Благодарит. Проявляет вежливость.',
      tone: 'friendly',
      intent: 'поблагодарить',
      replies: [
        { style: 'friendly', text: 'Пожалуйста 😊' },
        { style: 'flirty', text: 'Для тебя — всегда 😏' },
        { style: 'cold', text: 'Не за что.' }
      ]
    }
  },

  // === Вопросы «почему» ===
  {
    test: (t, lower) => /почему|зачем|с\s+какой\s+стати|нафига|нахуя/i.test(lower),
    result: {
      meaning: 'Задаёт вопрос «почему». Хочет понять мотивы.',
      tone: 'curious',
      intent: 'уточнить причину',
      replies: [
        { style: 'friendly', text: 'Сейчас объясню.' },
        { style: 'flirty', text: 'Потому что ты мне нравишься 😏' },
        { style: 'cold', text: 'Просто.' }
      ]
    }
  },

  // === Длинные сообщения / «слушай» ===
  {
    test: (t, lower) => /слушай|смотри|знаешь|кстати|а\s+ещё/i.test(lower) && t.length > 40,
    result: {
      meaning: 'Начинает длинное сообщение или хочет привлечь внимание к важной мысли.',
      tone: 'neutral',
      intent: 'рассказать что-то',
      replies: [
        { style: 'friendly', text: 'Слушаю. Рассказывай.' },
        { style: 'flirty', text: 'Я весь внимание 😏' },
        { style: 'cold', text: 'Говори.' }
      ]
    }
  },

  // === Эмодзи-only ===
  {
    test: (t, lower) => /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u.test(t),
    result: {
      meaning: 'Отправил только эмодзи. Хочет передать эмоцию без слов.',
      tone: 'playful',
      intent: 'выразить эмоцию',
      replies: [
        { style: 'friendly', text: '😄 Понял.' },
        { style: 'flirty', text: 'Нравится твой язык эмодзи 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Что?» / переспрос ===
  {
    test: (t, lower) => /^(что|чего|а\?|а\s+что|в\s+смысле\?)$/i.test(t.trim()),
    result: {
      meaning: 'Переспрашивает. Не понял или хочет уточнения.',
      tone: 'curious',
      intent: 'уточнить',
      replies: [
        { style: 'friendly', text: 'Сейчас повторю / объясню.' },
        { style: 'flirty', text: 'Не расслышал? 😏' },
        { style: 'cold', text: 'Ничего.' }
      ]
    }
  },

  // === «Не знаю» ===
  {
    test: (t, lower) => /не\s+знаю|хз|без\s+понятия|понятия\s+не\s+имею/i.test(lower),
    result: {
      meaning: 'Говорит, что не знает. Может быть честным ответом или желанием уйти от темы.',
      tone: 'dry',
      intent: 'уклониться / признать незнание',
      replies: [
        { style: 'friendly', text: 'Ничего страшного. Разберёмся.' },
        { style: 'flirty', text: 'Тогда давай вместе придумаем 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Может быть» ===
  {
    test: (t, lower) => /может\s+быть|возможно|наверное|скорее\s+всего|не\s+уверен/i.test(lower),
    result: {
      meaning: 'Неопределённый ответ. Не хочет брать на себя обязательства.',
      tone: 'dry',
      intent: 'оставить пространство',
      replies: [
        { style: 'friendly', text: 'Хорошо, тогда решим позже.' },
        { style: 'flirty', text: '«Может быть» — это почти «да» 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Потом» ===
  {
    test: (t, lower) => /потом|позже|не\s+сейчас|в\s+другой\s+раз|как-нибудь/i.test(lower),
    result: {
      meaning: 'Откладывает. Не готов сейчас, но оставляет дверь открытой.',
      tone: 'dry',
      intent: 'отложить',
      replies: [
        { style: 'friendly', text: 'Хорошо, как скажешь.' },
        { style: 'flirty', text: 'Буду ждать 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Ты серьёзно?» повтор ===
  {
    test: (t, lower) => /ты\s+это\s+серьёзно|ты\s+сейчас\s+серьёзно|серьёзно\s+сейчас/i.test(lower),
    result: {
      meaning: 'Сильно удивлён или сомневается в адекватности сказанного.',
      tone: 'sarcasm',
      intent: 'проверить',
      replies: [
        { style: 'friendly', text: 'Да, серьёзно. Объясню.' },
        { style: 'flirty', text: 'А ты как думал? 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // === «Хватит» ===
  {
    test: (t, lower) => /хватит|достаточно|стоп|остановись|перестань/i.test(lower),
    result: {
      meaning: 'Просит остановиться. Достиг предела.',
      tone: 'angry',
      intent: 'остановить',
      replies: [
        { style: 'friendly', text: 'Ок, останавливаюсь.' },
        { style: 'flirty', text: 'Уже? А мне только разогрелся 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Почему молчишь» ===
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

  // === «Я думаю» ===
  {
    test: (t, lower) => /я\s+думаю|мне\s+кажется|по-моему|наверное/i.test(lower),
    result: {
      meaning: 'Делится мнением. Хочет обсуждения.',
      tone: 'neutral',
      intent: 'высказать мнение',
      replies: [
        { style: 'friendly', text: 'Интересная мысль. Расскажи подробнее.' },
        { style: 'flirty', text: 'Мне нравится, как ты думаешь 😏' },
        { style: 'cold', text: 'Возможно.' }
      ]
    }
  },

  // === «Не хочу» ===
  {
    test: (t, lower) => /не\s+хочу|не\s+хочется|нет\s+желания|лень/i.test(lower),
    result: {
      meaning: 'Выражает нежелание. Может быть усталостью или отказом.',
      tone: 'dry',
      intent: 'отказаться',
      replies: [
        { style: 'friendly', text: 'Понял. Тогда не будем.' },
        { style: 'flirty', text: 'А я могу переубедить? 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Давай» ===
  {
    test: (t, lower) => /^(давай|давайте|го|погнали|поехали)$/i.test(t.trim()),
    result: {
      meaning: 'Согласие на действие. Готов начинать.',
      tone: 'happy',
      intent: 'согласиться',
      replies: [
        { style: 'friendly', text: 'Отлично, поехали!' },
        { style: 'flirty', text: 'Люблю, когда ты такой решительный 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Понял» ===
  {
    test: (t, lower) => /^(понял|поняла|ясно|ясноо|уяснил)$/i.test(t.trim()),
    result: {
      meaning: 'Подтверждает понимание. Часто закрывает тему.',
      tone: 'dry',
      intent: 'закрыть тему',
      replies: [
        { style: 'friendly', text: 'Супер.' },
        { style: 'flirty', text: 'Умничка 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === «Хорошо» длинное ===
  {
    test: (t, lower) => /хорошо|ладно|окей|договорились/i.test(lower) && t.length > 10,
    result: {
      meaning: 'Согласие в более развёрнутой форме. Положительный тон.',
      tone: 'friendly',
      intent: 'согласиться',
      replies: [
        { style: 'friendly', text: 'Отлично!' },
        { style: 'flirty', text: 'Рад, что мы на одной волне 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // === Дефолт ===
  {
    test: () => true,
    result: {
      meaning: 'Обычное сообщение без явных маркеров. Смысл зависит от вашего предыдущего диалога.',
      tone: 'neutral',
      intent: 'продолжить разговор',
      replies: [
        { style: 'friendly', text: 'Понял тебя. Расскажи подробнее?' },
        { style: 'flirty', text: 'Интересно. И что дальше? 😏' },
        { style: 'cold', text: 'Ясно.' }
      ]
    }
  }
];

// Дополнительные правила (вторая волна) — ещё больше паттернов
const EXTRA_RULES = [
  // Приветствия варианты
  {
    test: (t, lower) => /доброе\s+утро|с\s+добрым\s+утром|утро\s+доброе/i.test(lower),
    result: {
      meaning: 'Доброе утро. Хочет начать день с общения.',
      tone: 'friendly',
      intent: 'поздороваться',
      replies: [
        { style: 'friendly', text: 'Доброе утро! Как спалось?' },
        { style: 'flirty', text: 'Доброе 😏 Уже думал о тебе.' },
        { style: 'cold', text: 'Доброе.' }
      ]
    }
  },
  {
    test: (t, lower) => /добрый\s+вечер|вечер\s+добрый/i.test(lower),
    result: {
      meaning: 'Добрый вечер. Вежливое начало вечернего общения.',
      tone: 'friendly',
      intent: 'поздороваться',
      replies: [
        { style: 'friendly', text: 'Добрый вечер! Как день прошёл?' },
        { style: 'flirty', text: 'Добрый 😏 Как раз думал о тебе.' },
        { style: 'cold', text: 'Добрый.' }
      ]
    }
  },
  {
    test: (t, lower) => /спокойной\s+ночи|доброй\s+ночи|сладких\s+снов/i.test(lower),
    result: {
      meaning: 'Прощается на ночь. Завершает день.',
      tone: 'friendly',
      intent: 'попрощаться',
      replies: [
        { style: 'friendly', text: 'Спокойной ночи. Высыпайся.' },
        { style: 'flirty', text: 'Сладких снов… и чтобы я тебе приснился 😏' },
        { style: 'cold', text: 'Спокойной.' }
      ]
    }
  },

  // Эмоции
  {
    test: (t, lower) => /радуюсь|счастлив|счастлива|в\s+восторге|кайфую/i.test(lower),
    result: {
      meaning: 'Радуется. Хорошее настроение, хочет поделиться.',
      tone: 'happy',
      intent: 'поделиться радостью',
      replies: [
        { style: 'friendly', text: 'Круто! Рад за тебя.' },
        { style: 'flirty', text: 'Твоя радость заразительна 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /злюсь|бешусь|раздражает|бесит\s+меня/i.test(lower),
    result: {
      meaning: 'Злится. Нуждается в том, чтобы его выслушали.',
      tone: 'angry',
      intent: 'выплеснуть эмоции',
      replies: [
        { style: 'friendly', text: 'Что случилось? Расскажи.' },
        { style: 'flirty', text: 'Давай я тебя успокою 😏' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },
  {
    test: (t, lower) => /скучаю\s+по\s+тебе|очень\s+скучаю|соскучился\s+сильно/i.test(lower),
    result: {
      meaning: 'Сильно скучает. Эмоциональная привязанность.',
      tone: 'flirt',
      intent: 'показать чувства',
      replies: [
        { style: 'friendly', text: 'Я тоже. Скоро увидимся.' },
        { style: 'flirty', text: 'Знаешь, как приятно это слышать 😏' },
        { style: 'cold', text: 'Скоро.' }
      ]
    }
  },

  // Вопросы
  {
    test: (t, lower) => /что\s+думаешь|как\s+считаешь|твоё\s+мнение|как\s+ты\s+к\s+этому/i.test(lower),
    result: {
      meaning: 'Просит твоё мнение. Хочет вовлечь в обсуждение.',
      tone: 'curious',
      intent: 'узнать мнение',
      replies: [
        { style: 'friendly', text: 'Думаю, что…' },
        { style: 'flirty', text: 'Думаю, что ты классный 😏' },
        { style: 'cold', text: 'Нормально.' }
      ]
    }
  },
  {
    test: (t, lower) => /расскажи|поведай|поделись|что\s+было/i.test(lower),
    result: {
      meaning: 'Просит рассказать. Хочет услышать историю.',
      tone: 'curious',
      intent: 'узнать подробности',
      replies: [
        { style: 'friendly', text: 'Сейчас расскажу.' },
        { style: 'flirty', text: 'Только если ты потом тоже расскажешь 😏' },
        { style: 'cold', text: 'Позже.' }
      ]
    }
  },
  {
    test: (t, lower) => /можно\s+спросить|вопрос\s+есть|хочу\s+спросить/i.test(lower),
    result: {
      meaning: 'Предупреждает, что будет вопрос. Вежливость.',
      tone: 'shy',
      intent: 'задать вопрос',
      replies: [
        { style: 'friendly', text: 'Конечно, спрашивай.' },
        { style: 'flirty', text: 'Спрашивай что угодно 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // Отказы и сомнения
  {
    test: (t, lower) => /не\s+уверен|сомневаюсь|хз\s+даже|не\s+знаю\s+даже/i.test(lower),
    result: {
      meaning: 'Сомневается. Не готов дать чёткий ответ.',
      tone: 'dry',
      intent: 'выразить сомнение',
      replies: [
        { style: 'friendly', text: 'Ничего страшного, подумай.' },
        { style: 'flirty', text: 'Я помогу определиться 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /не\s+сейчас|потом\s+как-нибудь|в\s+другой\s+раз/i.test(lower),
    result: {
      meaning: 'Откладывает предложение. Мягкий отказ или перенос.',
      tone: 'dry',
      intent: 'отложить',
      replies: [
        { style: 'friendly', text: 'Хорошо, как скажешь.' },
        { style: 'flirty', text: 'Буду ждать удобного момента 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Флирт и намёки
  {
    test: (t, lower) => /поцелуй|целую|чмоки|💋|😘/i.test(lower),
    result: {
      meaning: 'Отправляет поцелуй / намёк на близость.',
      tone: 'flirt',
      intent: 'пофлиртовать',
      replies: [
        { style: 'friendly', text: '😘' },
        { style: 'flirty', text: 'Только один? Мало 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /обнимаю|обнимашки|🤗|хочу\s+обнять/i.test(lower),
    result: {
      meaning: 'Хочет объятий. Тёплый жест.',
      tone: 'flirt',
      intent: 'выразить тепло',
      replies: [
        { style: 'friendly', text: 'Обнимаю в ответ 🤗' },
        { style: 'flirty', text: 'Крепко-крепко 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },
  {
    test: (t, lower) => /милый|милашка|зайка|котёнок|солнце|золотце/i.test(lower),
    result: {
      meaning: 'Обращается ласково. Проявляет симпатию.',
      tone: 'flirt',
      intent: 'проявить нежность',
      replies: [
        { style: 'friendly', text: '😊 Приятно.' },
        { style: 'flirty', text: 'Только для тебя 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Жалобы
  {
    test: (t, lower) => /болит|голова\s+болит|живот\s+болит|плохо\s+себя\s+чувствую/i.test(lower),
    result: {
      meaning: 'Жалуется на самочувствие. Нуждается в поддержке.',
      tone: 'sad',
      intent: 'пожаловаться',
      replies: [
        { style: 'friendly', text: 'Выздоравливай. Отдыхай.' },
        { style: 'flirty', text: 'Давай я тебя полечу 😏' },
        { style: 'cold', text: 'Поправляйся.' }
      ]
    }
  },
  {
    test: (t, lower) => /денег\s+нет|нет\s+денег|бедный|бедная|зп\s+маленькая/i.test(lower),
    result: {
      meaning: 'Жалуется на финансы. Ищет понимания.',
      tone: 'sad',
      intent: 'пожаловаться',
      replies: [
        { style: 'friendly', text: 'Понимаю. Всё наладится.' },
        { style: 'flirty', text: 'Зато я у тебя есть 😏' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },

  // Планы на вечер/выходные
  {
    test: (t, lower) => /что\s+будешь\s+делать\s+вечером|какие\s+планы\s+на\s+вечер|вечером\s+свободен/i.test(lower),
    result: {
      meaning: 'Спрашивает про вечерние планы. Возможно, хочет предложить встречу.',
      tone: 'curious',
      intent: 'узнать планы / предложить',
      replies: [
        { style: 'friendly', text: 'Пока свободно. А у тебя?' },
        { style: 'flirty', text: 'Зависит от тебя 😏' },
        { style: 'cold', text: 'Ничего.' }
      ]
    }
  },
  {
    test: (t, lower) => /в\s+субботу|в\s+воскресенье|на\s+выходных\s+что/i.test(lower),
    result: {
      meaning: 'Спрашивает про выходные. Хочет понять, свободен ли ты.',
      tone: 'curious',
      intent: 'узнать планы',
      replies: [
        { style: 'friendly', text: 'Пока без планов. Предлагай.' },
        { style: 'flirty', text: 'Если предложишь что-то интересное — буду свободен 😏' },
        { style: 'cold', text: 'Не знаю.' }
      ]
    }
  },

  // Работа/усталость
  {
    test: (t, lower) => /после\s+работы|с\s+работы|устала\s+на\s+работе|заёб\s+на\s+работе/i.test(lower),
    result: {
      meaning: 'Устал после работы. Нуждается в отдыхе и поддержке.',
      tone: 'tired',
      intent: 'пожаловаться',
      replies: [
        { style: 'friendly', text: 'Отдыхай. Работа подождёт.' },
        { style: 'flirty', text: 'Давай я тебя отвлеку от всего этого 😏' },
        { style: 'cold', text: 'Отдыхай.' }
      ]
    }
  },

  // Музыка
  {
    test: (t, lower) => /музыка|песн|трек|слушаю|плейлист|спотифай/i.test(lower),
    result: {
      meaning: 'Говорит о музыке. Хочет поделиться вкусом.',
      tone: 'neutral',
      intent: 'поделиться',
      replies: [
        { style: 'friendly', text: 'Что слушаешь? Скинь трек.' },
        { style: 'flirty', text: 'Давай вместе послушаем 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Игры
  {
    test: (t, lower) => /играю|игры|компьютер|пк|консоль|стим|дота|кс|valorant/i.test(lower),
    result: {
      meaning: 'Говорит об играх. Возможно, предлагает поиграть вместе.',
      tone: 'neutral',
      intent: 'поделиться / предложить',
      replies: [
        { style: 'friendly', text: 'Во что играешь?' },
        { style: 'flirty', text: 'Может, вместе сыграем? 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // Путешествия
  {
    test: (t, lower) => /путешеств|отпуск|поездка|куда\s+поехать|хочу\s+в\s+отпуск/i.test(lower),
    result: {
      meaning: 'Говорит о путешествиях. Мечтает или планирует.',
      tone: 'happy',
      intent: 'поделиться мечтами',
      replies: [
        { style: 'friendly', text: 'Куда хочешь?' },
        { style: 'flirty', text: 'Давай вместе куда-нибудь 😏' },
        { style: 'cold', text: 'Круто.' }
      ]
    }
  },

  // Погода + настроение
  {
    test: (t, lower) => /дождь\s+за\s+окном|снег\s+идёт|холодно\s+сегодня|жарко\s+сегодня/i.test(lower),
    result: {
      meaning: 'Комментирует погоду. Часто способ начать разговор.',
      tone: 'neutral',
      intent: 'поддержать разговор',
      replies: [
        { style: 'friendly', text: 'Да, у меня тоже так.' },
        { style: 'flirty', text: 'В такую погоду лучше обниматься 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // «Ты онлайн?»
  {
    test: (t, lower) => /ты\s+онлайн|ты\s+здесь|ты\s+тут|але|ау/i.test(lower),
    result: {
      meaning: 'Проверяет, на месте ли ты. Хочет ответа.',
      tone: 'curious',
      intent: 'проверить присутствие',
      replies: [
        { style: 'friendly', text: 'Да, здесь. Что?' },
        { style: 'flirty', text: 'Всегда для тебя 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // «Не понял»
  {
    test: (t, lower) => /не\s+понял|не\s+поняла|не\s+догоняю|что\s+ты\s+имеешь/i.test(lower),
    result: {
      meaning: 'Не понял сообщение. Просит пояснения.',
      tone: 'curious',
      intent: 'уточнить',
      replies: [
        { style: 'friendly', text: 'Сейчас объясню проще.' },
        { style: 'flirty', text: 'Запутал тебя? 😏' },
        { style: 'cold', text: 'Повторю.' }
      ]
    }
  },

  // «Круто» и одобрение
  {
    test: (t, lower) => /круто|класс|огонь|топчик|имба|зачёт/i.test(lower),
    result: {
      meaning: 'Одобряет. Положительная реакция.',
      tone: 'happy',
      intent: 'одобрить',
      replies: [
        { style: 'friendly', text: 'Спасибо 😊' },
        { style: 'flirty', text: 'Знаю, что тебе понравится 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Жесть»
  {
    test: (t, lower) => /жест[ьи]|пиздец|пипец|капец|офигеть|ахренеть/i.test(lower),
    result: {
      meaning: 'Сильная реакция удивления или шока.',
      tone: 'sarcasm',
      intent: 'выразить шок',
      replies: [
        { style: 'friendly', text: 'Да, я тоже в шоке.' },
        { style: 'flirty', text: 'Жесть, да? 😏' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // «Норм»
  {
    test: (t, lower) => /^(норм|нормально|нормуль|сойдёт)$/i.test(t.trim()),
    result: {
      meaning: 'Сдержанная оценка. Не восторг и не негатив.',
      tone: 'dry',
      intent: 'оценить нейтрально',
      replies: [
        { style: 'friendly', text: 'Ок, понял.' },
        { style: 'flirty', text: 'Только «норм»? Я старался 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Пофиг»
  {
    test: (t, lower) => /пофиг|плевать|всё\s+равно|всё\s+равно\s+мне/i.test(lower),
    result: {
      meaning: 'Выражает безразличие. Может быть защитой или усталостью.',
      tone: 'dry',
      intent: 'показать безразличие',
      replies: [
        { style: 'friendly', text: 'Хорошо, как скажешь.' },
        { style: 'flirty', text: 'Даже мне пофиг? 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Я дома»
  {
    test: (t, lower) => /я\s+дома|уже\s+дома|приехал|приехала|на\s+месте/i.test(lower),
    result: {
      meaning: 'Сообщает, что дома / на месте. Информирует.',
      tone: 'neutral',
      intent: 'сообщить статус',
      replies: [
        { style: 'friendly', text: 'Отлично. Отдыхай.' },
        { style: 'flirty', text: 'Наконец-то. Я соскучился 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Выхожу»
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

  // «Задерживаюсь»
  {
    test: (t, lower) => /задерживаюсь|опоздаю|буду\s+позже|чуть\s+позже/i.test(lower),
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

  // «Не могу»
  {
    test: (t, lower) => /не\s+могу|не\s+получится|не\s+выйдет|занят/i.test(lower),
    result: {
      meaning: 'Говорит, что не может. Отказ или ограничение.',
      tone: 'dry',
      intent: 'отказать',
      replies: [
        { style: 'friendly', text: 'Понял. Тогда в другой раз.' },
        { style: 'flirty', text: 'Жаль 😏 Но я подожду.' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Давай завтра»
  {
    test: (t, lower) => /давай\s+завтра|завтра\s+напишу|завтра\s+созвонимся/i.test(lower),
    result: {
      meaning: 'Предлагает перенести на завтра.',
      tone: 'neutral',
      intent: 'перенести',
      replies: [
        { style: 'friendly', text: 'Хорошо, до завтра.' },
        { style: 'flirty', text: 'Буду ждать завтра 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Ты забыл»
  {
    test: (t, lower) => /ты\s+забыл|забыл\s+что|не\s+помнил|не\s+вспомнил/i.test(lower),
    result: {
      meaning: 'Упрекает в забывчивости.',
      tone: 'sarcasm',
      intent: 'упрекнуть',
      replies: [
        { style: 'friendly', text: 'Извини, правда вылетело.' },
        { style: 'flirty', text: 'Прости, заработался 😏 Напомни.' },
        { style: 'cold', text: 'Извини.' }
      ]
    }
  },

  // «Я шучу»
  {
    test: (t, lower) => /я\s+шучу|это\s+шутка|прикол|розыгрыш/i.test(lower),
    result: {
      meaning: 'Уточняет, что шутил. Снимает напряжение.',
      tone: 'playful',
      intent: 'разрядить',
      replies: [
        { style: 'friendly', text: 'А я уже повёлся 😄' },
        { style: 'flirty', text: 'Хорошо, что шутка 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Честно»
  {
    test: (t, lower) => /честно|по\s+правде|если\s+честно|скажу\s+честно/i.test(lower),
    result: {
      meaning: 'Хочет сказать что-то важное / откровенное.',
      tone: 'neutral',
      intent: 'быть честным',
      replies: [
        { style: 'friendly', text: 'Говори. Я слушаю.' },
        { style: 'flirty', text: 'Люблю, когда ты честный 😏' },
        { style: 'cold', text: 'Говори.' }
      ]
    }
  },

  // «Не обижайся»
  {
    test: (t, lower) => /не\s+обижайся|не\s+злись|не\s+сердись/i.test(lower),
    result: {
      meaning: 'Просит не обижаться. Чувствует, что мог задеть.',
      tone: 'shy',
      intent: 'смягчить',
      replies: [
        { style: 'friendly', text: 'Не обижаюсь. Всё нормально.' },
        { style: 'flirty', text: 'Только если поцелуешь 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Ты мне нравишься»
  {
    test: (t, lower) => /ты\s+мне\s+нравишься|я\s+в\s+тебе\s+влюбл|мне\s+с\s+тобой\s+хорошо/i.test(lower),
    result: {
      meaning: 'Признание в симпатии. Важный эмоциональный момент.',
      tone: 'flirt',
      intent: 'признаться',
      replies: [
        { style: 'friendly', text: 'Мне тоже с тобой хорошо.' },
        { style: 'flirty', text: 'Взаимно 😏' },
        { style: 'cold', text: 'Понял.' }
      ]
    }
  },

  // «Что случилось»
  {
    test: (t, lower) => /что\s+случилось|что\s+произошло|всё\s+в\s+порядке|ты\s+как/i.test(lower),
    result: {
      meaning: 'Беспокоится о тебе. Проявляет заботу.',
      tone: 'friendly',
      intent: 'проявить заботу',
      replies: [
        { style: 'friendly', text: 'Всё нормально, спасибо что спросил.' },
        { style: 'flirty', text: 'Всё хорошо, особенно когда ты пишешь 😏' },
        { style: 'cold', text: 'Норм.' }
      ]
    }
  },

  // «Давно не виделись»
  {
    test: (t, lower) => /давно\s+не\s+виделись|сколько\s+лет|как\s+долго\s+не\s+общались/i.test(lower),
    result: {
      meaning: 'Отмечает долгий перерыв в общении.',
      tone: 'friendly',
      intent: 'возобновить контакт',
      replies: [
        { style: 'friendly', text: 'Да, правда давно. Как ты?' },
        { style: 'flirty', text: 'Слишком давно 😏 Давай исправим.' },
        { style: 'cold', text: 'Да.' }
      ]
    }
  },

  // «Я занят»
  {
    test: (t, lower) => /я\s+занят|я\s+занята|сейчас\s+не\s+могу|нет\s+времени/i.test(lower),
    result: {
      meaning: 'Сообщает о занятости. Просит не отвлекать.',
      tone: 'dry',
      intent: 'отложить общение',
      replies: [
        { style: 'friendly', text: 'Хорошо, напиши когда освободишься.' },
        { style: 'flirty', text: 'Жду, когда освободишься 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Перезвоню»
  {
    test: (t, lower) => /перезвоню|потом\s+позвоню|наберу\s+позже/i.test(lower),
    result: {
      meaning: 'Обещает перезвонить. Откладывает разговор.',
      tone: 'neutral',
      intent: 'перенести',
      replies: [
        { style: 'friendly', text: 'Хорошо, жду.' },
        { style: 'flirty', text: 'Буду ждать твоего звонка 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Напиши»
  {
    test: (t, lower) => /напиши|пиши|свяжись|дай\s+знать/i.test(lower),
    result: {
      meaning: 'Просит написать. Хочет продолжения контакта.',
      tone: 'neutral',
      intent: 'поддержать связь',
      replies: [
        { style: 'friendly', text: 'Обязательно напишу.' },
        { style: 'flirty', text: 'Только тебе 😏' },
        { style: 'cold', text: 'Ок.' }
      ]
    }
  },

  // «Удачи»
  {
    test: (t, lower) => /удачи|успехов|всё\s+получится|держись/i.test(lower),
    result: {
      meaning: 'Желает удачи. Поддерживает.',
      tone: 'friendly',
      intent: 'поддержать',
      replies: [
        { style: 'friendly', text: 'Спасибо 😊' },
        { style: 'flirty', text: 'С тобой точно повезёт 😏' },
        { style: 'cold', text: 'Спасибо.' }
      ]
    }
  },

  // «Поздравляю»
  {
    test: (t, lower) => /поздравляю|с\s+днём\s+рождения|с\s+праздником|с\s+новым\s+годом/i.test(lower),
    result: {
      meaning: 'Поздравляет. Проявляет внимание.',
      tone: 'happy',
      intent: 'поздравить',
      replies: [
        { style: 'friendly', text: 'Спасибо большое!' },
        { style: 'flirty', text: 'Самый лучший подарок — ты 😏' },
        { style: 'cold', text: 'Спасибо.' }
      ]
    }
  },

  // Дефолт для EXTRA (не должен срабатывать, т.к. основной дефолт в RULES)
];

function localAnalyze(text) {
  const t = text.trim();
  const lower = t.toLowerCase();

  // Сначала основные правила
  for (const rule of RULES) {
    if (rule.test(t, lower)) {
      return rule.result;
    }
  }

  // Потом дополнительные
  for (const rule of EXTRA_RULES) {
    if (rule.test(t, lower)) {
      return rule.result;
    }
  }

  // На всякий случай финальный дефолт
  return {
    meaning: 'Обычное сообщение без явных маркеров. Смысл зависит от вашего предыдущего диалога.',
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
    const data = localAnalyze(text);
    render(data);
    $('analyze').disabled = false;
    $('analyze').textContent = 'Разобрать';
  }, 200);
}
