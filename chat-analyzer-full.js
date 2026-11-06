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

  // 1. Основные правила (самые точные)
  for (const rule of RULES) {
    if (rule.test(t, lower)) {
      return rule.result;
    }
  }

  // 2. Дополнительные ручные
  for (const rule of EXTRA_RULES) {
    if (rule.test(t, lower)) {
      return rule.result;
    }
  }

  // 3. Сгенерированные вариации (много паттернов)
  if (typeof GENERATED_RULES !== 'undefined') {
    for (const rule of GENERATED_RULES) {
      if (rule.test(t, lower)) {
        return rule.result;
      }
    }
  }

  // Дефолт
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
// === GENERATED RULES PART 2 (2000 rules) ===
// These are additional pattern variations. Order still matters somewhat.
const GENERATED_RULES = [
{
    test: (t, lower) => /(привет)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(привет\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(привет!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+привет)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(привет\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+приветик)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(прив)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(прив\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(прив!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+прив)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(прив\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хай)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хай\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(хай!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хай)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хай\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(hello)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(hello\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(hello!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+hello)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(hello\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(hi)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(hi\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(hi!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+hi)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(hi\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+здарова)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+здаров)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+здорово)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(салют)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(салют\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(салют!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+салют)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(салют\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+йоу)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(йо)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(йо\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(йо!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+йо)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(йо\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+доброе\s+утро)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+с\s+добрым\s+утром)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+утро\s+доброе)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+доброго\s+утра)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+добрый\s+день)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+день\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хорошего\s+дня)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+добрый\s+вечер)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+вечер\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хорошего\s+вечера)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+спокойной\s+ночи)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+доброй\s+ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сладких\s+снов)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+спокойной)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение.",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог.",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение.",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+дела)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+ты)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+жизнь)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+что\s+нового)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+настроение)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+сам)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+сама)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+оно)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+чё\s+как)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+поживаешь)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+хорошо)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+норм)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+отлично)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+супер)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе.",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор.",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+где)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+где\s+ты)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+где\s+сейчас)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+дома)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+на\s+работе)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+уже\s+дома)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+где\s+пропал)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+куда\s+делся)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+через\s+сколько)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+придёшь)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+будешь)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+приедешь)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+во\s+сколько)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+к\s+какому\s+времени)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+освободишься)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+занят)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+свободен)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+можешь\s+говорить)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+есть\s+время)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+мешаю)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+удобно\s+говорить)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь.",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность.",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "tired",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "playful",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "flirt",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хаха)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "sarcasm",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "dry",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "angry",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "shy",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "spam",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ахаха)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "neutral",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "happy",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(лол)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "sad",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(лол\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "curious",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(лол!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "tired",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+лол)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "playful",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(лол\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "flirt",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(кек)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "sarcasm",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(кек\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "dry",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(кек!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "angry",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+кек)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "shy",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(кек\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "spam",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ржу)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "neutral",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ржу\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "happy",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ржу!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "sad",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ржу)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "curious",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ржу\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "tired",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ржунимагу)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "playful",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ржунимагу\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "flirt",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ржунимагу!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "sarcasm",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ржунимагу)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "dry",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ржунимагу\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "angry",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(хех)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "shy",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хех\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "spam",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хех!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "neutral",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хех)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "happy",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хех\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "sad",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хихи)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "curious",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(хихи\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "tired",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хихи!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "playful",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хихи)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "flirt",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(хихи\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "sarcasm",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ахах)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "dry",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ахах\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "angry",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ахах!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "shy",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ахах)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "spam",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ахах\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "neutral",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(хахаха)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "happy",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хахаха\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "sad",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хахаха!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "curious",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хахаха)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "tired",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хахаха\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "playful",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(смешно)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "flirt",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(смешно\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "sarcasm",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(смешно!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "dry",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+смешно)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "angry",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(смешно\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "shy",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(угар)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "spam",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(угар\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "neutral",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(угар!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "happy",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+угар)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "sad",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(угар\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "curious",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "tired",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "playful",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "flirt",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+прикол)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "sarcasm",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "dry",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ржака)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "angry",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ржака\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "shy",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ржака!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "spam",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ржака)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко.",
      tone: "neutral",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ржака\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон.",
      tone: "happy",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(круто)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(круто\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "curious",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(круто!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "tired",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+круто)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "playful",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(круто\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "flirt",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(класс)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "sarcasm",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(класс\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "dry",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(класс!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "angry",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+класс)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "shy",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(класс\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "spam",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(огонь)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "neutral",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(огонь\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "happy",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(огонь!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+огонь)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "curious",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(огонь\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "tired",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(супер)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "playful",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(супер\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "flirt",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(супер!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "sarcasm",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+супер)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "dry",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(супер\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "angry",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(вау)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "shy",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(вау\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "spam",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(вау!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "neutral",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+вау)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "happy",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(вау\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "curious",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "tired",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "playful",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+офигеть)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "flirt",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "sarcasm",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(кайф)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "dry",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(кайф\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "angry",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(кайф!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "shy",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+кайф)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "spam",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(кайф\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "neutral",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(топ)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "happy",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(топ\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(топ!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "curious",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+топ)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "tired",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(топ\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "playful",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(топчик)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "flirt",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(топчик\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "sarcasm",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(топчик!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "dry",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+топчик)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "angry",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(топчик\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "shy",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(имба)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "spam",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(имба\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "neutral",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(имба!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "happy",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+имба)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(имба\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "curious",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "tired",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "playful",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "flirt",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+зачёт)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "sarcasm",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "dry",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(огого)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "angry",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(огого\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "shy",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(огого!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "spam",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+огого)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "neutral",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(огого\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "happy",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(нравится)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(нравится\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "curious",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нравится!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "tired",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+нравится)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "playful",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(нравится\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "flirt",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(классно)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "sarcasm",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(классно\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "dry",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(классно!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "angry",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+классно)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "shy",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(классно\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "spam",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(отлично)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "neutral",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(отлично\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "happy",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(отлично!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+отлично)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "curious",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(отлично\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "tired",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасно)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "playful",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасно\?)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "flirt",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасно!)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "sarcasm",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+прекрасно)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "dry",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасно\s+а)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "angry",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(замечательно)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "shy",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(замечательно\?)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "spam",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(замечательно!)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "neutral",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Рад, что понравилось 😊" },
        { style: 'flirty', text: "Нравится, когда ты так реагируешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+замечательно)/i.test(lower),
    result: {
      meaning: "Одобряет. Хороший знак.",
      tone: "happy",
      intent: "похвалить",
      replies: [
        { style: 'friendly', text: "Спасибо!" },
        { style: 'flirty', text: "Знаю, что тебе зайдёт 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(замечательно\s+а)/i.test(lower),
    result: {
      meaning: "Положительная реакция. Человеку нравится то, что ты написал.",
      tone: "sad",
      intent: "выразить одобрение",
      replies: [
        { style: 'friendly', text: "Круто, да?" },
        { style: 'flirty', text: "Только для тебя стараюсь 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(бесит)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(бесит\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(бесит!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+бесит)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(бесит\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(достал)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(достал\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(достал!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+достал)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(достал\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(надоел)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(надоел\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(надоел!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+надоел)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(надоел\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(отстань)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(отстань\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(отстань!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+отстань)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(отстань\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(отвали)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(отвали\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(отвали!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+отвали)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(отвали\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(заткнись)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(заткнись\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(заткнись!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+заткнись)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(заткнись\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(иди\s+нахуй)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(иди\s+нахуй\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(иди\s+нахуй!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+иди\s+нахуй)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(иди\s+нахуй\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(пошёл\s+нахуй)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(пошёл\s+нахуй\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пошёл\s+нахуй!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+пошёл\s+нахуй)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(пошёл\s+нахуй\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+злюсь)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+злюсь\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+злюсь!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+злюсь)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+злюсь\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+обиделся)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+обиделся\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+обиделся!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+обиделся)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+обиделся\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+обидно)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+обидно\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+обидно!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+мне\s+обидно)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+обидно\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+обидел)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+обидел\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+обидел!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+обидел)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+обидел\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+ты\s+так)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+ты\s+так\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+ты\s+так!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+почему\s+ты\s+так)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+ты\s+так\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(устал)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(устал\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(устал!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+устал)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(устал\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(устала)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(устала\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(устала!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+устала)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(устала\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(заебал)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(заебал\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(заебал!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+заебал)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(заебал\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(заебала)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(заебала\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(заебала!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+заебала)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(заебала\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+сил)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+сил\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+сил!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+нет\s+сил)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+сил\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(выгорел)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(выгорел\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(выгорел!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+выгорел)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(выгорел\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(грустно)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(грустно\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(грустно!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+грустно)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(грустно\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(плохо)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(плохо\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(плохо!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+плохо)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(плохо\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(тоскливо)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(тоскливо\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(тоскливо!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+тоскливо)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(тоскливо\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(депресс)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(депресс\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(депресс!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+депресс)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(депресс\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+плакать)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+плакать\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+плакать!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хочу\s+плакать)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+плакать\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(одиноко)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(одиноко\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(одиноко!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+одиноко)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "flirt",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(одиноко\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+одиноко)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "dry",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+одиноко\?)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "angry",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+одиноко!)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "shy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+мне\s+одиноко)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "spam",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(мне\s+одиноко\s+а)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "neutral",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(никто\s+не\s+пишет)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(никто\s+не\s+пишет\?)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "sad",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(никто\s+не\s+пишет!)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "curious",
      intent: "выразить недовольство",
      replies: [
        { style: 'friendly', text: "Понял, извини. Не хотел задеть." },
        { style: 'flirty', text: "Ого, как резко 😏 Что случилось?" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+никто\s+не\s+пишет)/i.test(lower),
    result: {
      meaning: "Выражает негативные эмоции. Нуждается в поддержке или хочет, чтобы отстали.",
      tone: "tired",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Я рядом. Хочешь поговорить?" },
        { style: 'flirty', text: "Давай я тебя подниму настроение 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(никто\s+не\s+пишет\s+а)/i.test(lower),
    result: {
      meaning: "Плохое настроение. Важно проявить внимание.",
      tone: "playful",
      intent: "получить поддержку",
      replies: [
        { style: 'friendly', text: "Отдыхай. Не надо себя изматывать." },
        { style: 'flirty', text: "Не хочу, чтобы ты злился 😏" },
        { style: 'cold', text: "Как скажешь." }
      ]
    }
  },
{
    test: (t, lower) => /(красив)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(красив\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(красив!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+красив)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(красив\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(симпатичн)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(симпатичн\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(симпатичн!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+симпатичн)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(симпатичн\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(мил)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(мил\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(мил!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+мил)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(мил\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(очаровательн)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(очаровательн\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(очаровательн!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+очаровательн)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(очаровательн\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(секси)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(секси\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(секси!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+секси)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(секси\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(горяч)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(горяч\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(горяч!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+горяч)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(горяч\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сексуальн)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(сексуальн\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(сексуальн!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сексуальн)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(сексуальн\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасн)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасн\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасн!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+прекрасн)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прекрасн\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(скучаю)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(скучаю\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(скучаю!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+скучаю)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(скучаю\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(соскучил)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(соскучил\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(соскучил!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+соскучил)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(соскучил\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+увидеть)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+увидеть\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+увидеть!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хочу\s+увидеть)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+увидеть\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+тебя)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+тебя\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+тебя!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хочу\s+тебя)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+тебя\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+увидимся)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(люблю\s+тебя)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(люблю\s+тебя\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(люблю\s+тебя!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+люблю\s+тебя)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(люблю\s+тебя\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+тебя\s+люблю)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+тебя\s+люблю\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+тебя\s+люблю!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+тебя\s+люблю)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+тебя\s+люблю\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+мне\s+нравишься)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+мне\s+нравишься\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+мне\s+нравишься!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+мне\s+нравишься)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+мне\s+нравишься\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+в\s+тебе\s+влюбл)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+в\s+тебе\s+влюбл\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+в\s+тебе\s+влюбл!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+в\s+тебе\s+влюбл)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+в\s+тебе\s+влюбл\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(поцелуй)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(поцелуй\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поцелуй!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+поцелуй)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(поцелуй\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(целую)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(целую\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(целую!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+целую)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(целую\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(чмоки)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чмоки\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(чмоки!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+чмоки)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чмоки\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимаю)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимаю\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимаю!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+обнимаю)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимаю\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимашки)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимашки\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимашки!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+обнимашки)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(обнимашки\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(милый)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(милый\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(милый!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+милый)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(милый\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(милашка)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(милашка\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(милашка!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+милашка)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(милашка\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(зайка)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(зайка\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(зайка!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+зайка)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(зайка\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(котёнок)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(котёнок\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(котёнок!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+котёнок)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(котёнок\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(солнце)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(солнце\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(солнце!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+солнце)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(солнце\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(золотце)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(золотце\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(золотце!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+золотце)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "neutral",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(золотце\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "happy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогая)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "sad",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогая\?)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "curious",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогая!)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "tired",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+дорогая)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "playful",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогая\s+а)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "flirt",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогой)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "sarcasm",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогой\?)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "dry",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Только один? Мало 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогой!)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "angry",
      intent: "пофлиртовать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊 Приятно слышать." },
        { style: 'flirty', text: "Взаимно 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+дорогой)/i.test(lower),
    result: {
      meaning: "Флиртует или делает комплимент. Проявляет интерес и симпатию.",
      tone: "shy",
      intent: "польстить",
      replies: [
        { style: 'friendly', text: "Я тоже. Давай скоро увидимся." },
        { style: 'flirty', text: "Знаю 😏 А ты ещё лучше." },
        { style: 'cold', text: "Скоро." }
      ]
    }
  },
{
    test: (t, lower) => /(дорогой\s+а)/i.test(lower),
    result: {
      meaning: "Выражает тёплые чувства. Эмоционально вовлечён.",
      tone: "spam",
      intent: "показать интерес",
      replies: [
        { style: 'friendly', text: "Обнимаю в ответ 🤗" },
        { style: 'flirty', text: "Соскучился? 😏 Я тоже очень." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+встретимся)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+встретимся\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+встретимся!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+давай\s+встретимся)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+встретимся\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(хочешь\s+встретиться)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хочешь\s+встретиться\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "flirt",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(хочешь\s+встретиться!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "sarcasm",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хочешь\s+встретиться)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "dry",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хочешь\s+встретиться\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "angry",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "shy",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "spam",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+увидимся)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+увидимся\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+сходим)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+сходим\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+сходим!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+давай\s+сходим)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "flirt",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+сходим\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "sarcasm",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(пошли\s+куда)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "dry",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пошли\s+куда\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "angry",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(пошли\s+куда!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "shy",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+пошли\s+куда)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "spam",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пошли\s+куда\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+что\s+будешь\s+делать)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "flirt",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "sarcasm",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "dry",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+какие\s+планы)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "angry",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "shy",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+выходных)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "spam",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+выходных\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+выходных!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+на\s+выходных)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+выходных\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+субботу)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+субботу\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+субботу!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "flirt",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+в\s+субботу)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "sarcasm",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+субботу\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "dry",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+воскресенье)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "angry",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+воскресенье\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "shy",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+воскресенье!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "spam",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+в\s+воскресенье)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+воскресенье\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать\s+вечером)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать\s+вечером\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать\s+вечером!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+что\s+будешь\s+делать\s+вечером)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+будешь\s+делать\s+вечером\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "flirt",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы\s+на\s+вечер)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "sarcasm",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы\s+на\s+вечер\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "dry",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы\s+на\s+вечер!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "angry",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+какие\s+планы\s+на\s+вечер)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "shy",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(какие\s+планы\s+на\s+вечер\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "spam",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(вечером\s+свободен)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(вечером\s+свободен\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(вечером\s+свободен!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+вечером\s+свободен)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(вечером\s+свободен\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(кино)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(кино\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "flirt",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(кино!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "sarcasm",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+кино)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "dry",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(кино\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "angry",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(фильм)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "shy",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(фильм\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "spam",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(фильм!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+фильм)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(фильм\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сериал)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(сериал\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(сериал!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сериал)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "flirt",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(сериал\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "sarcasm",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотреть)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "dry",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотреть\?)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "angry",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотреть!)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "shy",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+посмотреть)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "spam",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотреть\s+а)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "neutral",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотрел)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "happy",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотрел\?)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "sad",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотрел!)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "curious",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Давай. Когда тебе удобно?" },
        { style: 'flirty', text: "Уже давно жду этого предложения 😏" },
        { style: 'cold', text: "Может быть." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+посмотрел)/i.test(lower),
    result: {
      meaning: "Предлагает встречу или спрашивает о планах. Проявляет инициативу.",
      tone: "tired",
      intent: "договориться о встрече",
      replies: [
        { style: 'friendly', text: "Пока без особых планов. А у тебя?" },
        { style: 'flirty', text: "Зависит от того, предложишь ли ты что-то интересное 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(посмотрел\s+а)/i.test(lower),
    result: {
      meaning: "Хочет провести время вместе или узнать, свободен ли ты.",
      tone: "playful",
      intent: "узнать планы",
      replies: [
        { style: 'friendly', text: "Что смотришь? Порекомендуй." },
        { style: 'flirty', text: "Давай вместе посмотрим 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(работа)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "flirt",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(работа\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(работа!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "dry",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+работа)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "angry",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(работа\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "shy",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+работе)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "spam",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+работе\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "neutral",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+работе!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+на\s+работе)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sad",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+работе\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "curious",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(начальник)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "tired",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(начальник\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "playful",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(начальник!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "flirt",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+начальник)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(начальник\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "dry",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(коллеги)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "angry",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(коллеги\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "shy",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(коллеги!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "spam",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+коллеги)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "neutral",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(коллеги\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(офис)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sad",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(офис\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "curious",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(офис!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "tired",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+офис)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "playful",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(офис\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "flirt",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(зарплата)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(зарплата\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "dry",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(зарплата!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "angry",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+зарплата)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "shy",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(зарплата\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "spam",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(учёба)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "neutral",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(учёба\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(учёба!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sad",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+учёба)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "curious",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(учёба\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "tired",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(универ)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "playful",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(универ\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "flirt",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(универ!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+универ)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "dry",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(универ\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "angry",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(институт)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "shy",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(институт\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "spam",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(институт!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "neutral",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+институт)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(институт\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sad",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(экзамен)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "curious",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(экзамен\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "tired",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(экзамен!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "playful",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+экзамен)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "flirt",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(экзамен\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "dry",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "angry",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "shy",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+зачёт)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "spam",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(зачёт\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "neutral",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(сессия)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сессия\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sad",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(сессия!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "curious",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сессия)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "tired",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сессия\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "playful",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(препод)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "flirt",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(препод\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(препод!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "dry",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+препод)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "angry",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(препод\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "shy",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(после\s+работы)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "spam",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(после\s+работы\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "neutral",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(после\s+работы!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+после\s+работы)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sad",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(после\s+работы\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "curious",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+работы)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "tired",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+работы\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "playful",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+работы!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "flirt",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+с\s+работы)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "sarcasm",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+работы\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "dry",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(устала\s+на\s+работе)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "angry",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(устала\s+на\s+работе\?)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "shy",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(устала\s+на\s+работе!)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "spam",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Отдыхай. Работа подождёт." },
        { style: 'flirty', text: "Давай я тебя отвлеку 😏" },
        { style: 'cold', text: "Отдыхай." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+устала\s+на\s+работе)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "neutral",
      intent: "поделиться",
      replies: [
        { style: 'friendly', text: "Как там у тебя на работе?" },
        { style: 'flirty', text: "Работать — это хорошо, но отдыхать с тобой лучше 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(устала\s+на\s+работе\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о работе или учёбе. Может жаловаться или делиться новостями.",
      tone: "happy",
      intent: "пожаловаться",
      replies: [
        { style: 'friendly', text: "Как учёба? Сильно загружен?" },
        { style: 'flirty', text: "Учись, а потом расскажешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(есть)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sad",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "curious",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(есть!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "tired",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+есть)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "playful",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "flirt",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(голоден)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sarcasm",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(голоден\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "dry",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(голоден!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "angry",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+голоден)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "shy",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(голоден\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "spam",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(голодная)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "neutral",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(голодная\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "happy",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(голодная!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sad",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+голодная)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "curious",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(голодная\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "tired",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поесть)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "playful",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(поесть\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "flirt",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поесть!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sarcasm",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+поесть)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "dry",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поесть\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "angry",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(завтрак)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "shy",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(завтрак\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "spam",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(завтрак!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "neutral",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+завтрак)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "happy",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(завтрак\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sad",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(обед)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "curious",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(обед\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "tired",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(обед!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "playful",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+обед)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "flirt",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(обед\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sarcasm",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(ужин)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "dry",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ужин\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "angry",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(ужин!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "shy",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ужин)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "spam",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(ужин\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "neutral",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пицца)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "happy",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(пицца\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sad",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пицца!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "curious",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+пицца)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "tired",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пицца\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "playful",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(суши)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "flirt",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(суши\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sarcasm",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(суши!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "dry",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+суши)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "angry",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(суши\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "shy",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спать)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "spam",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(спать\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "neutral",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спать!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "happy",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+спать)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sad",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спать\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "curious",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(ложись)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "tired",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ложись\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "playful",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(ложись!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "flirt",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ложись)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sarcasm",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(ложись\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "dry",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+сплю)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "angry",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+сплю\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "shy",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+сплю!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "spam",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+уже\s+сплю)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "neutral",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+сплю\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "happy",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спать)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sad",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спать\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "curious",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спать!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "tired",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хочу\s+спать)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "playful",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спать\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "flirt",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(глаза\s+закрываются)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "sarcasm",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(глаза\s+закрываются\?)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "dry",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(глаза\s+закрываются!)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "angry",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+глаза\s+закрываются)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "shy",
      intent: "поговорить о еде",
      replies: [
        { style: 'friendly', text: "Что ешь? Я вот тоже проголодался." },
        { style: 'flirty', text: "Давай вместе что-нибудь вкусное 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(глаза\s+закрываются\s+а)/i.test(lower),
    result: {
      meaning: "Говорит о еде или сне. Базовые потребности + возможность для совместных планов.",
      tone: "spam",
      intent: "завершить день",
      replies: [
        { style: 'friendly', text: "Спокойной ночи. Высыпайся." },
        { style: 'flirty', text: "Сладких снов… и чтобы я тебе приснился 😏" },
        { style: 'cold', text: "Спокойной." }
      ]
    }
  },
{
    test: (t, lower) => /(почему)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(почему!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+почему)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(зачем)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(зачем\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(зачем!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sarcasm",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+зачем)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "dry",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(зачем\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+какой\s+стати)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "shy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+какой\s+стати\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "spam",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+какой\s+стати!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+с\s+какой\s+стати)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+какой\s+стати\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(нафига)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(нафига\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(нафига!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+нафига)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(нафига\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sarcasm",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+думаешь)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "dry",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+думаешь\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+думаешь!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "shy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+что\s+думаешь)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "spam",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+думаешь\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+считаешь)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+считаешь\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+считаешь!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+считаешь)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+считаешь\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(твоё\s+мнение)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(твоё\s+мнение\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sarcasm",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(твоё\s+мнение!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "dry",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+твоё\s+мнение)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(твоё\s+мнение\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "shy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\s+к\s+этому)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "spam",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\s+к\s+этому\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\s+к\s+этому!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+ты\s+к\s+этому)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\s+к\s+этому\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(расскажи)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(расскажи\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(расскажи!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+расскажи)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sarcasm",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(расскажи\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "dry",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(поведай)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(поведай\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "shy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(поведай!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "spam",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+поведай)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(поведай\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(поделись)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(поделись\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(поделись!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+поделись)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(поделись\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(можно\s+спросить)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sarcasm",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(можно\s+спросить\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "dry",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(можно\s+спросить!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+можно\s+спросить)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "shy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(можно\s+спросить\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "spam",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(вопрос\s+есть)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(вопрос\s+есть\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(вопрос\s+есть!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+вопрос\s+есть)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(вопрос\s+есть\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спросить)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спросить\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спросить!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sarcasm",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хочу\s+спросить)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "dry",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(хочу\s+спросить\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(правда\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "shy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(правда\?\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "spam",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(правда\?!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+правда\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(правда\?\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(серьёзно\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(серьёзно\?\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(серьёзно\?!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+серьёзно\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(серьёзно\?\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sarcasm",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(реально\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "dry",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(реально\?\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(реально\?!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "shy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+реально\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "spam",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(реально\?\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+натуре\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "happy",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+натуре\?\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "sad",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Сейчас объясню." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+натуре\?!)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Думаю, что…" },
        { style: 'flirty', text: "Потому что ты мне нравишься 😏" },
        { style: 'cold', text: "Просто." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+в\s+натуре\?)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "tired",
      intent: "узнать мнение",
      replies: [
        { style: 'friendly', text: "Конечно, спрашивай." },
        { style: 'flirty', text: "Мне нравится, как ты думаешь 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+натуре\?\s+а)/i.test(lower),
    result: {
      meaning: "Задаёт вопрос. Хочет понять или услышать твоё мнение.",
      tone: "playful",
      intent: "задать вопрос",
      replies: [
        { style: 'friendly', text: "Да, правда. Без шуток." },
        { style: 'flirty', text: "Спрашивай что угодно 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ок)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(ок\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ок!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ок)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(ок\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(окей)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(окей\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(окей!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+окей)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(окей\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(угу)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(угу\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(угу!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+угу)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(угу\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(ага)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(ага\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ага!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ага)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(ага\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ясно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(ясно\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(ясно!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ясно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(ясно\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(понятно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(понятно\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(понятно!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+понятно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(понятно\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(ладно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(ладно\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ладно!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ладно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(ладно\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошо)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошо\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошо!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хорошо)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошо\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(да)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(да\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(да!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+да)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(да\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(даа)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(даа\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(даа!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+даа)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(даа\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(дааа)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(дааа\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(дааа!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+дааа)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(дааа\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(yes)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(yes\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(yes!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+yes)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(yes\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(нет)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нет!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+нет)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(не\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(не!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(неа)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(неа\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(неа!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+неа)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(неа\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(no)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(no\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(no!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+no)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(no\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(норм)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(норм\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(норм!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+норм)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(норм\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(нормально)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нормально\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(нормально!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+нормально)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нормально\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(нормуль)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(нормуль\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нормуль!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+нормуль)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(нормуль\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+знаю)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+знаю\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+знаю!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+знаю)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+знаю\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(хз)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хз\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(хз!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хз)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хз\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(без\s+понятия)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(без\s+понятия\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(без\s+понятия!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+без\s+понятия)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(без\s+понятия\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(может\s+быть)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(может\s+быть\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(может\s+быть!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+может\s+быть)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(может\s+быть\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(возможно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(возможно\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(возможно!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+возможно)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(возможно\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(наверное)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(наверное\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(наверное!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+наверное)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(наверное\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(потом)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(потом\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(потом!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+потом)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(потом\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(позже)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(позже\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(позже!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+позже)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(позже\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сейчас)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сейчас\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сейчас!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+сейчас)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сейчас\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(понял)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(понял\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(понял!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+понял)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(понял\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(поняла)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поняла\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(поняла!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+поняла)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поняла\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(уяснил)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(уяснил\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уяснил!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+уяснил)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(уяснил\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(давай)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(давай!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+давай)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "dry",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "angry",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(го)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "shy",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(го\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "spam",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(го!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "neutral",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+го)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "happy",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(го\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sad",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(погнали)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "curious",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(погнали\?)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "tired",
      intent: "закрыть тему",
      replies: [
        { style: 'friendly', text: "Понял, без проблем." },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(погнали!)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "playful",
      intent: "подтвердить",
      replies: [
        { style: 'friendly', text: "Ничего страшного." },
        { style: 'flirty', text: "«Может быть» — это почти «да» 😏" },
        { style: 'cold', text: "Понял." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+погнали)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "flirt",
      intent: "согласиться",
      replies: [
        { style: 'friendly', text: "Хорошо! Тогда так и сделаем." },
        { style: 'flirty', text: "«Ок» — это да или «ок» — это отстань? 😏" },
        { style: 'cold', text: "Принято." }
      ]
    }
  },
{
    test: (t, lower) => /(погнали\s+а)/i.test(lower),
    result: {
      meaning: "Короткий ответ. Тон сильно зависит от контекста — может быть согласием, отказом или закрытием темы.",
      tone: "sarcasm",
      intent: "отказать",
      replies: [
        { style: 'friendly', text: "Отлично 👍" },
        { style: 'flirty', text: "Нравится, когда ты так уверенно соглашаешься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(извини)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "dry",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(извини\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "angry",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(извини!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "shy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+извини)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "spam",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(извини\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "neutral",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прости)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "happy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(прости\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sad",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прости!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "curious",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+прости)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "tired",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(прости\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "playful",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сорян)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "flirt",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сорян\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sarcasm",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(сорян!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "dry",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сорян)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "angry",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сорян\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "shy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(сорри)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "spam",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сорри\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "neutral",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сорри!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "happy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сорри)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sad",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сорри\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "curious",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(моя\s+вина)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "tired",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(моя\s+вина\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "playful",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(моя\s+вина!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "flirt",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+моя\s+вина)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sarcasm",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(моя\s+вина\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "dry",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спасибо)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "angry",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спасибо\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "shy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(спасибо!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "spam",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+спасибо)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "neutral",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спасибо\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "happy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(благодарю)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sad",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(благодарю\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "curious",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(благодарю!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "tired",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+благодарю)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "playful",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(благодарю\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "flirt",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спс)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sarcasm",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(спс\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "dry",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(спс!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "angry",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+спс)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "shy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(спс\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "spam",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(thx)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "neutral",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(thx\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "happy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(thx!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sad",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+thx)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "curious",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(thx\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "tired",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(thanks)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "playful",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(thanks\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "flirt",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(thanks!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sarcasm",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+thanks)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "dry",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(thanks\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "angry",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+обижайся)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "shy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+обижайся\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "spam",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+обижайся!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "neutral",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+обижайся)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "happy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+обижайся\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sad",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+злись)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "curious",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+злись\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "tired",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+злись!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "playful",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+злись)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "flirt",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+злись\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "sarcasm",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сердись)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "dry",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сердись\?)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "angry",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сердись!)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "shy",
      intent: "поблагодарить",
      replies: [
        { style: 'friendly', text: "Пожалуйста 😊" },
        { style: 'flirty', text: "Для тебя — всегда 😏" },
        { style: 'cold', text: "Не за что." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+сердись)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "spam",
      intent: "смягчить",
      replies: [
        { style: 'friendly', text: "Не обижаюсь." },
        { style: 'flirty', text: "Только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+сердись\s+а)/i.test(lower),
    result: {
      meaning: "Извиняется или благодарит. Проявляет вежливость и эмоции.",
      tone: "neutral",
      intent: "извиниться",
      replies: [
        { style: 'friendly', text: "Ничего страшного. Всё нормально." },
        { style: 'flirty', text: "Прощаю… но только если поцелуешь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+дома)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+дома\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+дома!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+дома)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+дома\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+дома)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+дома\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+дома!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+уже\s+дома)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+дома\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(приехал)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(приехал\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "neutral",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(приехал!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+приехал)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(приехал\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(приехала)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(приехала\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(приехала!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+приехала)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(приехала\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+месте)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+месте\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+месте!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+на\s+месте)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "neutral",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(на\s+месте\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(выхожу)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(выхожу\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(выхожу!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+выхожу)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(выхожу\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+выхожу)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+выхожу\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+выхожу!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+уже\s+выхожу)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(уже\s+выхожу\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(скоро\s+буду)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "neutral",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(скоро\s+буду\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(скоро\s+буду!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+скоро\s+буду)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(скоро\s+буду\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+пути)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+пути\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+пути!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+в\s+пути)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+пути\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(задерживаюсь)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(задерживаюсь\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(задерживаюсь!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "neutral",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+задерживаюсь)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(задерживаюсь\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(опоздаю)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(опоздаю\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(опоздаю!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+опоздаю)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(опоздаю\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(буду\s+позже)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(буду\s+позже\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(буду\s+позже!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+буду\s+позже)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(буду\s+позже\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "neutral",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занят)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занят\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занят!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+занят)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занят\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занята)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занята\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занята!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+занята)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+занята\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(сейчас\s+не\s+могу)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сейчас\s+не\s+могу\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "neutral",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сейчас\s+не\s+могу!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сейчас\s+не\s+могу)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(сейчас\s+не\s+могу\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+времени)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+времени\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+времени!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+нет\s+времени)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(нет\s+времени\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(перезвоню)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(перезвоню\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(перезвоню!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+перезвоню)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "neutral",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(перезвоню\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "happy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(потом\s+позвоню)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sad",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(потом\s+позвоню\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "curious",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(потом\s+позвоню!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "tired",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+потом\s+позвоню)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "playful",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(потом\s+позвоню\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "flirt",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(наберу\s+позже)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "sarcasm",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(наберу\s+позже\?)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "dry",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Хорошо, не торопись." },
        { style: 'flirty', text: "Главное — приходи 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(наберу\s+позже!)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "angry",
      intent: "сообщить статус",
      replies: [
        { style: 'friendly', text: "Напиши когда освободишься." },
        { style: 'flirty', text: "Жду, когда освободишься 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+наберу\s+позже)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "shy",
      intent: "предупредить",
      replies: [
        { style: 'friendly', text: "Отлично. Отдыхай." },
        { style: 'flirty', text: "Наконец-то. Я соскучился 😏" },
        { style: 'cold', text: "Жду." }
      ]
    }
  },
{
    test: (t, lower) => /(наберу\s+позже\s+а)/i.test(lower),
    result: {
      meaning: "Сообщает статус: дома, в пути, занят и т.д. Информирует.",
      tone: "spam",
      intent: "отложить",
      replies: [
        { style: 'friendly', text: "Жду." },
        { style: 'flirty', text: "Уже жду не дождусь 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(слушай)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(слушай\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(слушай!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+слушай)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(слушай\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(смотри)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(смотри\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(смотри!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+смотри)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(смотри\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(знаешь)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(знаешь\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(знаешь!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+знаешь)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(знаешь\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(кстати)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(кстати\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(кстати!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+кстати)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(кстати\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(что\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(что\?\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(что\?!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+что\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(что\?\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чего\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чего\?\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(чего\?!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+чего\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(чего\?\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(а\?\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\?!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+а\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(а\?\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+смысле\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+смысле\?\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+смысле\?!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+в\s+смысле\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(в\s+смысле\?\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(хватит)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хватит\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хватит!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хватит)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хватит\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(достаточно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(достаточно\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(достаточно!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+достаточно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(достаточно\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(стоп)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(стоп\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(стоп!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+стоп)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(стоп\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(перестань)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(перестань\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(перестань!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+перестань)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(перестань\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+молчишь)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+молчишь\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+молчишь!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+почему\s+молчишь)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(почему\s+молчишь\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\s+пропал)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\s+пропал\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\s+пропал!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+где\s+пропал)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\s+пропал\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(долго\s+не\s+писал)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(долго\s+не\s+писал\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(долго\s+не\s+писал!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+долго\s+не\s+писал)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(долго\s+не\s+писал\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+шучу)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+шучу\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+шучу!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+я\s+шучу)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(я\s+шучу\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(это\s+шутка)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(это\s+шутка\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(это\s+шутка!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+это\s+шутка)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(это\s+шутка\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+прикол)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(прикол\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(честно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(честно\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(честно!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+честно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(честно\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(по\s+правде)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(по\s+правде\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(по\s+правде!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+по\s+правде)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(по\s+правде\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(если\s+честно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(если\s+честно\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(если\s+честно!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+если\s+честно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(если\s+честно\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+забыл)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+забыл\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+забыл!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+забыл)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+забыл\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(забыл\s+что)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(забыл\s+что\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(забыл\s+что!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+забыл\s+что)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(забыл\s+что\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(удачи)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(удачи\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(удачи!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+удачи)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(удачи\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(успехов)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(успехов\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(успехов!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+успехов)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(успехов\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(держись)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(держись\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(держись!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+держись)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(держись\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(поздравляю)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поздравляю\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поздравляю!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+поздравляю)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(поздравляю\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+днём\s+рождения)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+днём\s+рождения\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+днём\s+рождения!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+с\s+днём\s+рождения)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+днём\s+рождения\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+праздником)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+праздником\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+праздником!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+с\s+праздником)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+праздником\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(жест)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(жест\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(жест!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+жест)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(жест\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пиздец)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пиздец\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пиздец!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+пиздец)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(пиздец\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(пипец)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(пипец\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(пипец!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+пипец)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пипец\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(капец)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(капец\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(капец!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+капец)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(капец\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+офигеть)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(офигеть\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пофиг)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(пофиг\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(пофиг!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+пофиг)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(пофиг\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(плевать)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(плевать\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(плевать!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+плевать)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(плевать\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+равно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+равно\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+равно!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+равно)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+равно\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+могу)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+могу\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+могу!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+могу)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+могу\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+получится)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+получится\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+получится!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+получится)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+получится\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+выйдет)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+выйдет\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+выйдет!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+выйдет)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+выйдет\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+завтра)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+завтра\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+завтра!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+давай\s+завтра)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(давай\s+завтра\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(завтра\s+напишу)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(завтра\s+напишу\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(завтра\s+напишу!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+завтра\s+напишу)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(завтра\s+напишу\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(напиши)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(напиши\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(напиши!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+напиши)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(напиши\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(пиши)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(пиши\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(пиши!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+пиши)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(пиши\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(свяжись)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(свяжись\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(свяжись!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+свяжись)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(свяжись\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+онлайн)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+онлайн\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+онлайн!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+онлайн)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+онлайн\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+здесь)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+здесь\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+здесь!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+здесь)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+здесь\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+тут)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+тут\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+тут!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+тут)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+тут\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(але)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(але\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(але!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+але)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(але\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+понял)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+понял\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+понял!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+понял)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+понял\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+догоняю)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+догоняю\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+догоняю!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Прости, заработался 😏" },
        { style: 'cold', text: "Извини." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+догоняю)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Сейчас объясню проще." },
        { style: 'flirty', text: "С тобой точно повезёт 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+догоняю\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, правда давно. Как ты?" },
        { style: 'flirty', text: "Самый лучший подарок — ты 😏" },
        { style: 'cold', text: "Спасибо." }
      ]
    }
  },
{
    test: (t, lower) => /(давно\s+не\s+виделись)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Всё нормально, спасибо что спросил." },
        { style: 'flirty', text: "Жесть, да? 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(давно\s+не\s+виделись\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Слушаю. Рассказывай." },
        { style: 'flirty', text: "Даже мне пофиг? 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(давно\s+не\s+виделись!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Сейчас повторю." },
        { style: 'flirty', text: "Жаль 😏 Но я подожду." },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+давно\s+не\s+виделись)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "flirt",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Ок, останавливаюсь." },
        { style: 'flirty', text: "Буду ждать завтра 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(давно\s+не\s+виделись\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sarcasm",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Извини, отвлёкся." },
        { style: 'flirty', text: "Только тебе 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+случилось)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "dry",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "А я уже повёлся 😄" },
        { style: 'flirty', text: "Всегда для тебя 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+случилось\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "angry",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Говори. Я слушаю." },
        { style: 'flirty', text: "Запутал тебя? 😏" },
        { style: 'cold', text: "Повторю." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+случилось!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "shy",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Извини, правда вылетело." },
        { style: 'flirty', text: "Слишком давно 😏 Давай исправим." },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+что\s+случилось)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "spam",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Спасибо 😊" },
        { style: 'flirty', text: "Всё хорошо, особенно когда ты пишешь 😏" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+случилось\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "neutral",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Спасибо большое!" },
        { style: 'flirty', text: "Я весь внимание 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+в\s+порядке)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "happy",
      intent: "привлечь внимание",
      replies: [
        { style: 'friendly', text: "Да, я тоже в шоке." },
        { style: 'flirty', text: "Не расслышал? 😏" },
        { style: 'cold', text: "Ничего." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+в\s+порядке\?)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "sad",
      intent: "уточнить",
      replies: [
        { style: 'friendly', text: "Хорошо, как скажешь." },
        { style: 'flirty', text: "Уже? А мне только разогрелся 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+в\s+порядке!)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "curious",
      intent: "остановить",
      replies: [
        { style: 'friendly', text: "Понял. Тогда в другой раз." },
        { style: 'flirty', text: "Скучал? 😏 Я вернулся." },
        { style: 'cold', text: "Был занят." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+в\s+порядке)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "tired",
      intent: "поддержать",
      replies: [
        { style: 'friendly', text: "Обязательно напишу." },
        { style: 'flirty', text: "Хорошо, что шутка 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+в\s+порядке\s+а)/i.test(lower),
    result: {
      meaning: "Разные бытовые и эмоциональные сообщения. Зависит от контекста.",
      tone: "playful",
      intent: "поздравить",
      replies: [
        { style: 'friendly', text: "Да, здесь. Что?" },
        { style: 'flirty', text: "Люблю, когда ты честный 😏" },
        { style: 'cold', text: "Говори." }
      ]
    }
  },
{
    test: (t, lower) => /(привет)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(привет\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(привет!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+привет)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(привет\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+приветик)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(приветик\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(прив)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(прив\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(прив!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+прив)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(прив\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хай)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хай\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(хай!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хай)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хай\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(hello)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(hello\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(hello!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+hello)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(hello\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(hi)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(hi\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(hi!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+hi)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(hi\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+здарова)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здарова\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+здаров)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здаров\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+здорово)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(здорово\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(салют)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(салют\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(салют!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+салют)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(салют\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+йоу)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(йоу\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(йо)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(йо\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(йо!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+йо)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(йо\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+доброе\s+утро)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброе\s+утро\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+с\s+добрым\s+утром)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(с\s+добрым\s+утром\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+утро\s+доброе)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(утро\s+доброе\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+доброго\s+утра)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброго\s+утра\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+добрый\s+день)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+день\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+день\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(день\s+добрый\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хорошего\s+дня)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+дня\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+добрый\s+вечер)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(добрый\s+вечер\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+вечер\s+добрый)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(вечер\s+добрый\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хорошего\s+вечера)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(хорошего\s+вечера\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+спокойной\s+ночи)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+ночи\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+доброй\s+ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(доброй\s+ночи\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов\?)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов!)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+сладких\s+снов)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "angry",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(сладких\s+снов\s+а)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "shy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "spam",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\?)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "neutral",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной!)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "happy",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+спокойной)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "sad",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(спокойной\s+а)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "curious",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "tired",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи\?)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "playful",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Привет! Как настроение?" },
        { style: 'flirty', text: "Привет, красавица/красавчик 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи!)/i.test(lower),
    result: {
      meaning: "Простое приветствие. Хочет начать или продолжить общение. (вариант)",
      tone: "flirt",
      intent: "поздороваться",
      replies: [
        { style: 'friendly', text: "Привет! Как дела?" },
        { style: 'flirty', text: "Привет 😏 Уже соскучился?" },
        { style: 'cold', text: "Привет." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ночи)/i.test(lower),
    result: {
      meaning: "Вежливое приветствие. Настраивается на диалог. (вариант)",
      tone: "sarcasm",
      intent: "начать разговор",
      replies: [
        { style: 'friendly', text: "Привет 😊 Рад тебя видеть." },
        { style: 'flirty', text: "Приветик 😏 Как раз о тебе думал." },
        { style: 'cold', text: "Здарова." }
      ]
    }
  },
{
    test: (t, lower) => /(ночи\s+а)/i.test(lower),
    result: {
      meaning: "Тёплое приветствие. Хорошее настроение. (вариант)",
      tone: "dry",
      intent: "проявить вежливость",
      replies: [
        { style: 'friendly', text: "Здорово! Что нового?" },
        { style: 'flirty', text: "Хай 😏 По тебе скучал." },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+дела)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+дела\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+ты)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+ты\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+жизнь)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+жизнь\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+что\s+нового)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(что\s+нового\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+настроение)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+настроение\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+сам)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сам\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+сама)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+сама\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+оно)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+оно\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+чё\s+как)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(чё\s+как\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+как\s+поживаешь)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(как\s+поживаешь\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+хорошо)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+хорошо\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+норм)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "sarcasm",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+норм\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "dry",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "angry",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично\?)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "shy",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично!)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "spam",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+отлично)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "neutral",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+отлично\s+а)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "happy",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "sad",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер\?)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "curious",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Всё хорошо! А ты как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер!)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "tired",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Норм, работаю. А ты?" },
        { style: 'flirty', text: "С тобой — всегда хорошо 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+всё\s+супер)/i.test(lower),
    result: {
      meaning: "Спрашивает как дела. Хочет узнать о тебе. (вариант)",
      tone: "playful",
      intent: "поддержать разговор",
      replies: [
        { style: 'friendly', text: "Отлично, спасибо что спросил." },
        { style: 'flirty', text: "Думаю о тебе, поэтому отлично 😏" },
        { style: 'cold', text: "Нормально." }
      ]
    }
  },
{
    test: (t, lower) => /(всё\s+супер\s+а)/i.test(lower),
    result: {
      meaning: "Интересуется твоим состоянием. Классический способ поддержать разговор. (вариант)",
      tone: "flirt",
      intent: "узнать о тебе",
      replies: [
        { style: 'friendly', text: "Нормально, спасибо. А у тебя как?" },
        { style: 'flirty', text: "Лучше, когда ты пишешь 😏 А ты как?" },
        { style: 'cold', text: "Норм." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+где)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+где\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+где\s+ты)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+ты\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+где\s+сейчас)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+сейчас\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+дома)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+дома\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+на\s+работе)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+на\s+работе\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+уже\s+дома)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+уже\s+дома\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+где\s+пропал)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(где\s+пропал\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+куда\s+делся)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(куда\s+делся\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+через\s+сколько)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(через\s+сколько\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+придёшь)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+придёшь\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+будешь)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+будешь\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+приедешь)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+приедешь\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+во\s+сколько)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(во\s+сколько\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+к\s+какому\s+времени)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(к\s+какому\s+времени\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+когда\s+освободишься)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(когда\s+освободишься\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+занят)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+занят\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ты\s+свободен)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(ты\s+свободен\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+можешь\s+говорить)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(можешь\s+говорить\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+есть\s+время)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "tired",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(есть\s+время\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "playful",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "flirt",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю\?)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "sarcasm",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю!)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "dry",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+не\s+мешаю)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "angry",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(не\s+мешаю\s+а)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "shy",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "spam",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить\?)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "neutral",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить!)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "happy",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Сейчас дома / в пути. А ты?" },
        { style: 'flirty', text: "Для тебя всегда найду время 😏" },
        { style: 'cold', text: "Дома." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+удобно\s+говорить)/i.test(lower),
    result: {
      meaning: "Уточняет твоё местоположение или время. Хочет понять, когда ты будешь. (вариант)",
      tone: "sad",
      intent: "скоординироваться",
      replies: [
        { style: 'friendly', text: "Да, свободен. Что случилось?" },
        { style: 'flirty', text: "Уже почти, не скучай 😏" },
        { style: 'cold', text: "Да." }
      ]
    }
  },
{
    test: (t, lower) => /(удобно\s+говорить\s+а)/i.test(lower),
    result: {
      meaning: "Проверяет, свободен ли ты. Вежливо уточняет доступность. (вариант)",
      tone: "curious",
      intent: "проверить доступность",
      replies: [
        { style: 'friendly', text: "Скоро буду, напишу как выйду." },
        { style: 'flirty', text: "Соскучился? 😏 Я уже в пути." },
        { style: 'cold', text: "Буду — напишу." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко. (вариант)",
      tone: "tired",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха\?)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон. (вариант)",
      tone: "playful",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха!)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко. (вариант)",
      tone: "flirt",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+хаха)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон. (вариант)",
      tone: "sarcasm",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(хаха\s+а)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко. (вариант)",
      tone: "dry",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон. (вариант)",
      tone: "angry",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха\?)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко. (вариант)",
      tone: "shy",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха!)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон. (вариант)",
      tone: "spam",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Смешно, да?" },
        { style: 'flirty', text: "Только ради твоей улыбки 😏" },
        { style: 'cold', text: "Ага." }
      ]
    }
  },
{
    test: (t, lower) => /(а\s+ахаха)/i.test(lower),
    result: {
      meaning: "Смеётся. Настроение хорошее, диалог идёт легко. (вариант)",
      tone: "neutral",
      intent: "поддержать весёлый тон",
      replies: [
        { style: 'friendly', text: "Рад, что зашло 😄" },
        { style: 'flirty', text: "Смеёшься — значит нравлюсь 😏" },
        { style: 'cold', text: "Понятно." }
      ]
    }
  },
{
    test: (t, lower) => /(ахаха\s+а)/i.test(lower),
    result: {
      meaning: "Нашёл сообщение смешным. Хочет поддержать весёлый тон. (вариант)",
      tone: "happy",
      intent: "поделиться реакцией",
      replies: [
        { style: 'friendly', text: "Хех, я старался." },
        { style: 'flirty', text: "Люблю твой смех 😏" },
        { style: 'cold', text: "Ок." }
      ]
    }
  },
];
