// Символ скрытия по умолчанию — тот же, что в оригинальном боте
export const DEFAULT_SYMBOL = '▒';

// Стандартный процентный шаг как в config.py оригинального бота: PERCENT_STEP = 0.33, старт с 0.1
export const DEFAULT_PERCENT_STEP = 0.33;
export const MIN_PERCENTAGE = 0.1;
export const MAX_PERCENTAGE = 1.0;

/**
 * Простая детерминированная псевдослучайная хеш-функция (PRNG),
 * чтобы один и тот же стих при том же проценте и режиме всегда скрывал одни и те же слова.
 */
function pseudoRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Проверка, является ли символ буквой (русской, английской и т.д.)
 */
export function isLetter(char) {
  return /^\p{L}$/u.test(char);
}

/**
 * Разбивка слова на префиксные знаки препинания, корневую буквенную часть и суффиксные знаки.
 * Например: "« ветром, " -> { prefix: "«", core: "ветром", suffix: "," }
 */
export function splitWordPunctuation(word) {
  let start = 0;
  while (start < word.length && !isLetter(word[start])) {
    start++;
  }

  let end = word.length - 1;
  while (end >= start && !isLetter(word[end])) {
    end--;
  }

  if (start > end) {
    // В слове вообще нет букв (например, "—" или "...")
    return { prefix: word, core: '', suffix: '', lettersCount: 0 };
  }

  const prefix = word.slice(0, start);
  const core = word.slice(start, end + 1);
  const suffix = word.slice(end + 1);

  // Считаем только буквы
  let lettersCount = 0;
  for (let i = 0; i < core.length; i++) {
    if (isLetter(core[i])) lettersCount++;
  }

  return { prefix, core, suffix, lettersCount };
}

/**
 * Маскировка одной буквенной части слова: буквы заменяются на символ маскировки,
 * а внутренние дефисы/апострофы сохраняются.
 */
export function maskCoreWord(core, symbol = DEFAULT_SYMBOL) {
  return core
    .split('')
    .map((char) => (isLetter(char) ? symbol : char))
    .join('');
}

/**
 * Основная функция скрытия слов в стихотворении
 *
 * @param {string} text - Исходный текст стихотворения
 * @param {number} percentage - Процент скрытия (от 0.0 до 1.0)
 * @param {Object} options - Настройки
 * @param {string} options.symbol - Символ скрытия (по умолчанию '▒')
 * @param {string} options.mode - 'cumulative' (накопительный), 'classic' (как в боте), 'rhyme' (концы строк), 'first_words' (начала строк)
 * @param {Set<string>} options.revealedWordKeys - Множество ключей временно открытых пользователем слов (для интерактивного подглядывания)
 * @returns {Array<{ type: 'line' | 'empty', words: Array<{ key, raw, masked, isMasked, isTemporarilyRevealed, isPunctOnly }> }>}
 */
export function processPoem(text, percentage, options = {}) {
  const {
    symbol = DEFAULT_SYMBOL,
    mode = 'cumulative',
    revealedWordKeys = new Set(),
  } = options;

  if (!text) return [];

  const rawLines = text.split('\n');
  const resultLines = [];

  rawLines.forEach((rawLine, lineIdx) => {
    const trimmed = rawLine.trim();

    if (trimmed === '') {
      resultLines.push({
        type: 'empty',
        lineIdx,
        raw: '',
        words: [],
      });
      return;
    }

    // Разбиваем строку на слова по пробелам
    const tokens = rawLine.split(/\s+/).filter(Boolean);
    const parsedWords = tokens.map((token, wordIdx) => {
      const { prefix, core, suffix, lettersCount } = splitWordPunctuation(token);
      const key = `${lineIdx}_${wordIdx}`;

      // По правилу оригинального бота: слова длиной <= 2 букв не скрываются
      const isEligible = lettersCount > 2;

      return {
        key,
        lineIdx,
        wordIdx,
        raw: token,
        prefix,
        core,
        suffix,
        lettersCount,
        isEligible,
        shouldMask: false,
      };
    });

    const eligibleIndices = parsedWords
      .map((w, idx) => (w.isEligible ? idx : -1))
      .filter((idx) => idx !== -1);

    if (eligibleIndices.length > 0 && percentage > 0.01) {
      if (mode === 'rhyme') {
        // Режим рифм: скрываем последнее подходящее слово в строке
        const lastEligible = eligibleIndices[eligibleIndices.length - 1];
        parsedWords[lastEligible].shouldMask = true;
      } else if (mode === 'first_words') {
        // Режим первых слов: скрываем первое подходящее слово
        const firstEligible = eligibleIndices[0];
        parsedWords[firstEligible].shouldMask = true;
      } else if (mode === 'classic') {
        // Логика оригинального бота:
        // num_to_spoiler = max(1, int(len(words) * percentage))
        // random.seed(int(1042 * 1.1 - percentage))
        const numToSpoiler = Math.min(
          eligibleIndices.length,
          Math.max(1, Math.floor(eligibleIndices.length * percentage))
        );

        // Детерминированный выбор случайных индексов
        const seedBase = lineIdx * 1000 + Math.floor(percentage * 100);
        const shuffled = [...eligibleIndices].sort((a, b) => {
          const rA = pseudoRandom(seedBase + a * 17);
          const rB = pseudoRandom(seedBase + b * 17);
          return rA - rB;
        });

        const selected = shuffled.slice(0, numToSpoiler);
        selected.forEach((idx) => {
          parsedWords[idx].shouldMask = true;
        });
      } else {
        // Режим 'cumulative' (накопительный, рекомендуется для заучивания):
        // Каждому подходящему слову строки присваивается постоянный детерминированный приоритет (ранг).
        // При увеличении процента скрываются слова с наивысшим рангом,
        // поэтому уже скрытые слова ГАРАНТИРОВАННО остаются скрытыми!
        const numToSpoiler = Math.min(
          eligibleIndices.length,
          Math.max(1, Math.floor(eligibleIndices.length * percentage))
        );

        const ranked = [...eligibleIndices].sort((a, b) => {
          // Фиксированный seed для строки, не зависящий от процента!
          const rA = pseudoRandom(lineIdx * 739 + a * 37);
          const rB = pseudoRandom(lineIdx * 739 + b * 37);
          return rA - rB;
        });

        const toMask = ranked.slice(0, numToSpoiler);
        toMask.forEach((idx) => {
          parsedWords[idx].shouldMask = true;
        });
      }
    }

    // Собираем итоговую структуру для рендеринга
    const finalWords = parsedWords.map((w) => {
      const isTemporarilyRevealed = revealedWordKeys.has(w.key);
      const isMasked = w.shouldMask && !isTemporarilyRevealed;

      const maskedCore = isMasked ? maskCoreWord(w.core, symbol) : w.core;
      const display = w.prefix + maskedCore + w.suffix;

      return {
        key: w.key,
        lineIdx: w.lineIdx,
        wordIdx: w.wordIdx,
        raw: w.raw,
        prefix: w.prefix,
        core: w.core,
        suffix: w.suffix,
        display,
        isEligible: w.isEligible,
        isMasked,
        isTemporarilyRevealed,
        hasMasking: w.shouldMask,
      };
    });

    resultLines.push({
      type: 'line',
      lineIdx,
      raw: rawLine,
      words: finalWords,
    });
  });

  return resultLines;
}
