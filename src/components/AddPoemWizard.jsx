import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Wand2,
  FileText,
  User,
  Quote,
  Eye,
  Edit3,
  Trash2,
  ClipboardPaste,
} from 'lucide-react';
import {
  formatPoemText,
  smartDetectPoemFields,
  calculatePoemStats,
} from '../utils/formatter';

export function AddPoemWizard({ onSavePoem, onCancel }) {
  const [step, setStep] = useState(1); // 1: Автор/Название, 2: Текст, 3: Приведение в порядок

  // Данные формы
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('Мои стихи');
  const [rawText, setRawText] = useState('');

  // Опции форматирования
  const [optCleanJunk, setOptCleanJunk] = useState(true);
  const [optTypography, setOptTypography] = useState(true);
  const [optNormalizeStanzas, setOptNormalizeStanzas] = useState(true);

  // Отредактированный текст на шаге 3
  const [formattedText, setFormattedText] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' или 'edit'

  // Вставка из буфера обмена с автоопределением полей
  const handlePasteAll = async () => {
    try {
      let clipboardText = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        clipboardText = await navigator.clipboard.readText();
      }

      if (!clipboardText) {
        clipboardText = prompt('Вставьте текст стихотворения целиком (с автором или без):');
      }

      if (!clipboardText) return;

      const detected = smartDetectPoemFields(clipboardText);
      if (detected.author) setAuthor(detected.author);
      if (detected.title) setTitle(detected.title);
      if (detected.text) setRawText(detected.text);

      // Переходим сразу на шаг 2, если текст определился
      if (detected.text && (detected.author || detected.title)) {
        setStep(2);
      }
    } catch (e) {
      console.error('Ошибка вставки:', e);
    }
  };

  // Переход на шаг 3: автоматическое применение очистки
  const handleGoToStep3 = () => {
    if (!rawText.trim()) {
      alert('Пожалуйста, введите текст стихотворения');
      return;
    }

    const cleaned = formatPoemText(rawText, {
      cleanJunk: optCleanJunk,
      typography: optTypography,
      normalizeStanzas: optNormalizeStanzas,
    });

    setFormattedText(cleaned);
    setStep(3);
  };

  // Повторное применение настроек форматирования при их переключении на шаге 3
  const handleReapplyFormat = (cleanJunk, typography, normalizeStanzas) => {
    const cleaned = formatPoemText(rawText, {
      cleanJunk,
      typography,
      normalizeStanzas,
    });
    setFormattedText(cleaned);
  };

  // Сохранение стихотворения
  const handleSave = (startLearningNow = false) => {
    const finalText = (formattedText || rawText).trim();
    if (!finalText) {
      alert('Текст стихотворения не может быть пустым');
      return;
    }

    const newPoem = {
      title: title.trim() || 'Без названия',
      author: author.trim() || 'Неизвестный автор',
      year: year.trim(),
      category: category.trim() || 'Мои стихи',
      text: finalText,
    };

    onSavePoem(newPoem, startLearningNow);
  };

  const rawStats = calculatePoemStats(rawText);
  const formattedStats = calculatePoemStats(formattedText);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
      
      {/* Шаги индикатора */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
          <span className={step >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
            1. Название и Автор
          </span>
          <span className={step >= 2 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
            2. Текст стиха
          </span>
          <span className={step >= 3 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
            3. Приведение в порядок
          </span>
        </div>

        {/* Полоса прогресса шагов */}
        <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* ШАГ 1: АВТОР И НАЗВАНИЕ */}
      {step === 1 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm animate-in fade-in">
          
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Шаг 1: Автор и Название</span>
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Укажите, чьё это стихотворение и как оно озаглавлено
              </p>
            </div>

            <button
              onClick={handlePasteAll}
              title="Вставить весь стих сразу"
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200 dark:border-amber-900/60 font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Авто-вставка</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Имя автора
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Например: Александр Пушкин, или Ваше имя"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Название стихотворения
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Я помню чудное мгновенье… или Парус"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Год написания (необязательно)
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Например: 1825"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Категория / Тематика
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Мои стихи, Классика, Для школы"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              Отмена
            </button>

            <button
              onClick={() => {
                if (!title.trim() && !author.trim()) {
                  if (!confirm('Продолжить без указания автора и названия?')) return;
                }
                setStep(2);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-1.5 shadow-xs shadow-indigo-500/25 transition-all"
            >
              <span>Далее: Текст стиха</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ШАГ 2: ТЕКСТ СТИХОТВОРЕНИЯ */}
      {step === 2 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm animate-in fade-in">
          
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Quote className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Шаг 2: Текст стихотворения</span>
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Вставьте или напечатайте строки. Разделяйте строфы пустой строкой.
              </p>
            </div>

            <button
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) setRawText(clip);
                } catch {
                  // ignore
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-medium flex items-center gap-1.5 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Вставить</span>
            </button>
          </div>

          <div className="space-y-3">
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Вставьте сюда текст стихотворения...

Например:
Белеет парус одинокой
В тумане моря голубом!..
Что ищет он в стране далекой?
Что кинул он в краю родном?..`}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-serif leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-base resize-y"
            />

            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
              <span>
                {rawStats.linesCount} строк • {rawStats.wordsCount} слов • {rawStats.stanzasCount} строф
              </span>
              {rawText && (
                <button
                  onClick={() => setRawText('')}
                  className="hover:text-rose-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Очистить</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>

            <button
              onClick={handleGoToStep3}
              disabled={!rawText.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium text-sm flex items-center gap-1.5 shadow-xs shadow-indigo-500/25 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span>Далее: Привести в порядок</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ШАГ 3: ПРИВЕДЕНИЕ В ПОРЯДОК И ПРЕДПРОСМОТР */}
      {step === 3 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm animate-in fade-in">
          
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Шаг 3: Приводим стихотворение в порядок</span>
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Бот аккуратно очистил лишние пробелы, нормализовал строфы и выставил литературную типографику.
            </p>
          </div>

          {/* Панель настроек очистки */}
          <div className="mb-6 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2.5 text-xs sm:text-sm">
            <div className="font-semibold text-stone-800 dark:text-stone-200 mb-2">
              Автоматические улучшения:
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={optNormalizeStanzas}
                onChange={(e) => {
                  setOptNormalizeStanzas(e.target.checked);
                  handleReapplyFormat(optCleanJunk, optTypography, e.target.checked);
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-stone-700 dark:text-stone-300">
                <strong>Нормализовать строфы:</strong> убрать лишние пустые строки и хвостовые пробелы
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={optTypography}
                onChange={(e) => {
                  setOptTypography(e.target.checked);
                  handleReapplyFormat(optCleanJunk, e.target.checked, optNormalizeStanzas);
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-stone-700 dark:text-stone-300">
                <strong>Русская типографика:</strong> кавычки «ёлочки», длинное тире (—), многоточия (…)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={optCleanJunk}
                onChange={(e) => {
                  setOptCleanJunk(e.target.checked);
                  handleReapplyFormat(e.target.checked, optTypography, optNormalizeStanzas);
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-stone-700 dark:text-stone-300">
                <strong>Удалить мусор:</strong> убрать ссылки, теги <code>#стихи</code> и рекламу каналов
              </span>
            </label>
          </div>

          {/* Вкладки: Предпросмотр или Ручная правка */}
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
                  activeTab === 'preview'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Красивый предпросмотр</span>
              </button>

              <button
                onClick={() => setActiveTab('edit')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
                  activeTab === 'edit'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Править вручную</span>
              </button>
            </div>

            <span className="text-xs text-stone-500 pb-2.5">
              {formattedStats.linesCount} строк • {formattedStats.wordsCount} слов
            </span>
          </div>

          {/* Окно предпросмотра / редактирования */}
          {activeTab === 'preview' ? (
            <div className="p-6 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 font-serif leading-relaxed text-stone-900 dark:text-stone-100 max-h-96 overflow-y-auto whitespace-pre-line text-base">
              <div className="text-center mb-4 pb-3 border-b border-stone-200/60 dark:border-stone-700/60">
                <h3 className="font-bold text-lg">{title || 'Без названия'}</h3>
                <p className="text-xs text-amber-800 dark:text-amber-400 italic">
                  {author || 'Неизвестный автор'} {year ? `(${year})` : ''}
                </p>
              </div>
              {formattedText}
            </div>
          ) : (
            <textarea
              rows={12}
              value={formattedText}
              onChange={(e) => setFormattedText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-serif leading-relaxed text-base resize-y"
            />
          )}

          {/* Кнопки сохранения */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleSave(false)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-sm text-stone-700 dark:text-stone-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>В библиотеку</span>
              </button>

              <button
                onClick={() => handleSave(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Сохранить и учить!</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
