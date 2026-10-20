/**
 * Утилиты для «приведения в порядок» стихотворений (очистка, форматирование, типографика).
 */

/**
 * Очистка от рекламного мусора, хештегов и ссылок
 */
export function removeJunkAndAds(text) {
  if (!text) return '';

  let cleaned = text;

  // Удаление хештегов (#стихи #пушкин и т.д.)
  cleaned = cleaned.replace(/#[\wа-яА-ЯёЁ_]+/gi, '');

  // Удаление ссылок (http, https, t.me)
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');
  cleaned = cleaned.replace(/t\.me\/\S+/gi, '');

  // Удаление упоминаний каналов (@channel)
  cleaned = cleaned.replace(/@[\w_]+/gi, '');

  return cleaned;
}

/**
 * Русская типографика: кавычки «елочки», длинное тире —, многоточие …
 */
export function formatRussianTypography(text) {
  if (!text) return '';

  let res = text;

  // Многоточия
  res = res.replace(/\.{3,}/g, '…');

  // Тире между словами (например: "Я помню - чудное" -> "Я помню — чудное")
  res = res.replace(/(?<=\S)\s+[-–—]\s+(?=\S)/g, ' — ');
  res = res.replace(/--+/g, '—');

  // Кавычки: заменяем парные прямые кавычки "слово" на «слово»
  // 1) открывающая кавычка после пробела, скобки или в начале строки
  res = res.replace(/(^|[\s(\[{])"/g, '$1«');
  // 2) закрывающая кавычка перед пробелом, знаком препинания или в конце строки
  res = res.replace(/"([\s)\]}.,!?:;…—]|$)/g, '»$1');
  // 3) оставшиеся одинарные " заменяем контекстно
  res = res.replace(/"/g, '»');

  return res;
}

/**
 * Нормализация пробелов и строф
 */
export function normalizeSpacingAndStanzas(text) {
  if (!text) return '';

  // Разбиваем на строки
  const lines = text.split(/\r?\n/);

  // Триммим каждую строку и схлопываем множественные внутренние пробелы
  const cleanedLines = lines.map((line) => {
    return line.replace(/[ \t]{2,}/g, ' ').trim();
  });

  // Схлопываем множественные пустые строки подряд (оставляем максимум одну пустую строку между строфами)
  const resultLines = [];
  let prevWasEmpty = false;

  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    const isEmpty = line === '';

    if (isEmpty) {
      if (!prevWasEmpty && resultLines.length > 0) {
        resultLines.push('');
        prevWasEmpty = true;
      }
    } else {
      resultLines.push(line);
      prevWasEmpty = false;
    }
  }

  // Убираем хвостовую пустую строку, если есть
  while (resultLines.length > 0 && resultLines[resultLines.length - 1] === '') {
    resultLines.pop();
  }

  return resultLines.join('\n');
}

/**
 * Комплексная очистка и форматирование стихотворения
 *
 * @param {string} rawText
 * @param {Object} options
 * @param {boolean} options.cleanJunk - удалять ли хештеги и ссылки
 * @param {boolean} options.typography - применять ли правила русской типографики
 * @param {boolean} options.normalizeStanzas - нормализовать ли строфы и пробелы
 */
export function formatPoemText(rawText, options = {}) {
  const {
    cleanJunk = true,
    typography = true,
    normalizeStanzas = true,
  } = options;

  if (!rawText) return '';

  let text = rawText;

  if (cleanJunk) {
    text = removeJunkAndAds(text);
  }

  if (typography) {
    text = formatRussianTypography(text);
  }

  if (normalizeStanzas) {
    text = normalizeSpacingAndStanzas(text);
  }

  return text;
}

/**
 * Попытка автоматически извлечь название, автора и текст,
 * если пользователь вставил всё одной сплошной пачкой
 */
export function smartDetectPoemFields(rawText) {
  if (!rawText) return { author: '', title: '', text: '' };

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { author: '', title: '', text: '' };

  let author = '';
  let title = '';
  let textLines = [...lines];

  // Проверяем первую строку: часто это "Автор — Название" или "Автор. Название"
  const firstLine = lines[0];
  const authorTitleMatch = firstLine.match(/^([а-яА-ЯёЁa-zA-Z\s.]+?)\s*(?:—|-|–|:)\s*(.+)$/);

  if (authorTitleMatch && lines.length >= 2) {
    author = authorTitleMatch[1].trim();
    title = authorTitleMatch[2].trim().replace(/^«|»$/g, '');
    textLines = lines.slice(1);
  } else if (lines.length > 3) {
    // Если первая строка короткая (< 50 символов) и похожа на автора или название
    const secondLine = lines[1];
    // Проверка: первая строка автор?
    if (/^[а-яА-ЯёЁa-zA-Z\s.]{2,40}$/.test(firstLine) && lines.length > 2) {
      author = firstLine;
      title = secondLine.replace(/^«|»$/g, '');
      textLines = lines.slice(2);
    } else {
      // Иначе первая строка — название
      title = firstLine.replace(/^«|»$/g, '');
      textLines = lines.slice(1);
    }
  } else {
    title = firstLine.replace(/^«|»$/g, '');
    textLines = lines.slice(1);
  }

  return {
    author,
    title,
    text: textLines.join('\n'),
  };
}

/**
 * Подсчет статистики стихотворения (строки, строфы, слова)
 */
export function calculatePoemStats(text) {
  if (!text) return { linesCount: 0, stanzasCount: 0, wordsCount: 0 };

  const lines = text.split('\n');
  const nonEmptyLines = lines.filter((l) => l.trim() !== '');

  // Строфы определяются по разделению пустыми строками
  let stanzasCount = 0;
  let inStanza = false;

  for (const l of lines) {
    if (l.trim() !== '') {
      if (!inStanza) {
        stanzasCount++;
        inStanza = true;
      }
    } else {
      inStanza = false;
    }
  }

  const wordsCount = text.split(/\s+/).filter((w) => /[а-яёa-z]/i.test(w)).length;

  return {
    linesCount: nonEmptyLines.length,
    stanzasCount: Math.max(1, stanzasCount),
    wordsCount,
  };
}
