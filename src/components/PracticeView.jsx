import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  Heart,
  ChevronLeft,
  Share2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { processPoem, DEFAULT_PERCENT_STEP, MIN_PERCENTAGE, MAX_PERCENTAGE } from '../utils/spoilerizer';

export function PracticeView({
  poem,
  onBackToLibrary,
  onToggleFavorite,
  onUpdateProgress,
  settings,
}) {
  const [percentage, setPercentage] = useState(poem.progressPercentage || MIN_PERCENTAGE);
  const [isPeekActive, setIsPeekActive] = useState(false); // Подглядывание всего текста (кнопка 🫣 / 🙈)
  const [revealedWordKeys, setRevealedWordKeys] = useState(new Set()); // Индивидуально подсмотренные слова
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const speechRef = useRef(null);

  // Сброс подсмотренных слов при смене стиха или процента
  useEffect(() => {
    setRevealedWordKeys(new Set());
    setIsPeekActive(false);
  }, [percentage, poem.id]);

  // Сохранение прогресса
  useEffect(() => {
    onUpdateProgress(poem.id, percentage, percentage >= 0.99);
  }, [percentage, poem.id]);

  // Остановка аудио при уходе
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Шаг назад («⬅️ Легче»)
  const handlePreviousStep = () => {
    const nextVal = Math.max(MIN_PERCENTAGE, Math.round((percentage - DEFAULT_PERCENT_STEP) * 100) / 100);
    setPercentage(nextVal);
  };

  // Шаг вперед («Сложнее ➡️»)
  const handleNextStep = () => {
    const nextVal = Math.min(MAX_PERCENTAGE, Math.round((percentage + DEFAULT_PERCENT_STEP) * 100) / 100);
    setPercentage(nextVal);
  };

  // Переключение режима подглядывания всего стиха (аналог callback "toggle_spoiler" из бота)
  const handleToggleSpoiler = () => {
    setIsPeekActive(!isPeekActive);
  };

  // Индивидуальный клик по скрытому слову (подсмотреть только его)
  const handleWordClick = (wordKey) => {
    setRevealedWordKeys((prev) => {
      const next = new Set(prev);
      if (next.has(wordKey)) {
        next.delete(wordKey);
      } else {
        next.add(wordKey);
      }
      return next;
    });
  };

  // Сброс обучения на 10%
  const handleReset = () => {
    setPercentage(MIN_PERCENTAGE);
    setIsPeekActive(false);
    setRevealedWordKeys(new Set());
  };

  // Празднование победы (выучил!)
  const handleMastered = () => {
    onUpdateProgress(poem.id, 1.0, true);
    setPercentage(1.0);

    // Запуск салюта из конфетти
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#6366f1', '#10b981', '#ec4899'],
    });
  };

  // Озвучивание стихотворения (Web Speech API)
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Синтез речи не поддерживается вашим браузером');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(poem.text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.88; // Чуть медленнее для выразительности чтения поэзии

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Расчет скрытых строк и слов
  // Если активен режим подглядывания (isPeekActive), показываем 0% скрытия
  const effectivePercentage = isPeekActive ? 0.0 : percentage;

  const processedLines = processPoem(poem.text, effectivePercentage, {
    symbol: settings.symbol || '▒',
    mode: settings.mode || 'cumulative',
    revealedWordKeys: isPeekActive ? new Set() : revealedWordKeys,
  });

  // Расчет уровня сложности (1..4)
  const levelNumber =
    percentage <= 0.15 ? 1 : percentage <= 0.45 ? 2 : percentage <= 0.78 ? 3 : 4;

  const levelLabels = {
    1: '10% скрыто — Лёгкая разминка',
    2: '43% скрыто — Тренировка памяти',
    3: '76% скрыто — Глубокое запоминание',
    4: '100% скрыто — Проверка наизусть',
  };

  // Класс шрифта в зависимости от настроек
  const getFontFamilyClass = () => {
    if (settings.fontFamily === 'playfair') return 'font-["Playfair_Display",serif]';
    if (settings.fontFamily === 'sans') return 'font-sans';
    if (settings.fontFamily === 'mono') return 'font-mono';
    return 'font-["Lora",serif]'; // default
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28">
      
      {/* Верхняя панель: Назад, Название стиха, Избранное */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <button
          onClick={onBackToLibrary}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>К библиотеке</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            title="Инструкция"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleSpeak}
            title={isSpeaking ? 'Остановить чтение' : 'Прослушать с выражением'}
            className={`p-2 rounded-lg transition-colors ${
              isSpeaking
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onToggleFavorite(poem.id)}
            title={poem.isFavorite ? 'Убрать из избранного' : 'В избранное'}
            className={`p-2 rounded-lg transition-colors ${
              poem.isFavorite
                ? 'text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/50'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Всплывающая подсказка / инструкция */}
      {showHelp && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50/90 dark:bg-stone-800/80 border border-amber-200/80 dark:border-amber-900/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed shadow-xs animate-in fade-in">
          <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1.5 flex items-center gap-1.5">
            <span>💡 Как учить стихи в СтихоУме:</span>
          </h4>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Сложнее ➡️</strong> — скрывает больше слов на каждом шаге (+33%).</li>
            <li><strong>⬅️ Легче</strong> — возвращает слова, если стало слишком трудно.</li>
            <li><strong>🫣 Подглядеть</strong> — на миг показывает весь оригинальный стих целиком (кнопка <strong>🙈</strong> вернет маскировку).</li>
            <li><strong>Клик по скрытому слову</strong> — нажмите прямо на замаскированное слово <code>▒▒▒▒</code>, чтобы быстро подсмотреть только его!</li>
            <li>Короткие слова (предлоги и союзы длиной ≤ 2 букв) не скрываются, чтобы сохранить ритмику.</li>
          </ul>
        </div>
      )}

      {/* Карточка заголовка стиха */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1.5">
          {poem.title}
        </h1>
        <p className="text-sm sm:text-base font-serif italic text-amber-800 dark:text-amber-400">
          {poem.author} {poem.year ? `(${poem.year})` : ''}
        </p>

        {poem.isMastered && (
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Выучено наизусть</span>
          </div>
        )}
      </div>

      {/* Панель прогресса сложности */}
      <div className="mb-6 p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
          <span className="font-medium text-stone-600 dark:text-stone-400">
            Сложность: <strong className="text-stone-900 dark:text-stone-100">{Math.round(percentage * 100)}%</strong>
          </span>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
            {levelLabels[levelNumber]}
          </span>
        </div>

        {/* Прогресс-бар 4 уровней */}
        <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex gap-1 p-0.5">
          {[1, 2, 3, 4].map((step) => {
            const isActive = levelNumber >= step;
            return (
              <div
                key={step}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600'
                    : 'bg-stone-200 dark:bg-stone-800'
                }`}
              />
            );
          })}
        </div>

        {/* Быстрые кнопки шагов (10%, 43%, 76%, 100%) */}
        <div className="flex justify-between mt-2 pt-1 border-t border-stone-100 dark:border-stone-800/60 text-[11px] text-stone-500">
          {[
            { p: 0.1, label: '10%' },
            { p: 0.43, label: '43%' },
            { p: 0.76, label: '76%' },
            { p: 1.0, label: '100%' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setPercentage(item.p)}
              className={`px-2 py-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                Math.abs(percentage - item.p) < 0.05
                  ? 'font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-2'
                  : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Текст стихотворения */}
      <div
        className={`p-6 sm:p-10 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm transition-all duration-200 ${getFontFamilyClass()}`}
        style={{ fontSize: `${settings.fontSize || 18}px`, lineHeight: 1.8 }}
      >
        {isPeekActive && (
          <div className="mb-4 pb-2 border-b border-amber-200/60 dark:border-amber-900/60 text-center text-xs font-sans text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1.5 animate-pulse">
            <Eye className="w-3.5 h-3.5" />
            <span>Режим подглядывания включен (нажмите 🙈 чтобы снова скрыть слова)</span>
          </div>
        )}

        <div className="space-y-4 select-text">
          {processedLines.map((line, idx) => {
            if (line.type === 'empty') {
              // Разделитель строф
              return <div key={idx} className="h-4 sm:h-5" />;
            }

            return (
              <div key={idx} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                {line.words.map((w) => {
                  if (w.isMasked) {
                    return (
                      <span
                        key={w.key}
                        onClick={() => handleWordClick(w.key)}
                        title="Нажмите, чтобы подсмотреть это слово"
                        className="inline-block cursor-pointer px-1 py-0.5 rounded transition-all select-none font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200/60 dark:border-amber-900/40 active:scale-95"
                      >
                        {w.prefix}
                        <span className="tracking-widest font-bold">{maskCoreWord(w.core, settings.symbol || '▒')}</span>
                        {w.suffix}
                      </span>
                    );
                  }

                  if (w.isTemporarilyRevealed) {
                    return (
                      <span
                        key={w.key}
                        onClick={() => handleWordClick(w.key)}
                        title="Нажмите, чтобы снова скрыть"
                        className="inline-block cursor-pointer px-1 py-0.5 rounded font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-xs"
                      >
                        {w.display}
                      </span>
                    );
                  }

                  return (
                    <span key={w.key} className="text-stone-900 dark:text-stone-100">
                      {w.display}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Вспомогательные действия под стихом */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-200 p-1.5 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Начать заново (10%)</span>
        </button>

        <button
          onClick={handleMastered}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors font-medium"
        >
          <Award className="w-4 h-4" />
          <span>Я выучил наизусть! 🎉</span>
        </button>
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ (Точно повторяет кнопки оригинального Telegram-бота:
          "⬅️ Легче", "🫣" / "🙈", "Сложнее ➡️") */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
          
          {/* Кнопка "⬅️ Легче" (активна если процент > 0.11) */}
          <button
            onClick={handlePreviousStep}
            disabled={percentage <= MIN_PERCENTAGE + 0.01}
            className={`flex-1 sm:flex-initial sm:min-w-[140px] px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              percentage > MIN_PERCENTAGE + 0.01
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95'
                : 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-900 text-stone-400'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Легче</span>
          </button>

          {/* Кнопка "🫣" / "🙈" (Подглядеть / Скрыть) */}
          <button
            onClick={handleToggleSpoiler}
            title={isPeekActive ? 'Скрыть слова обратно' : 'Подглядеть весь стих'}
            className={`px-6 py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
              isPeekActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/50'
                : 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900'
            }`}
          >
            <span className="text-xl leading-none">{isPeekActive ? '🙈' : '🫣'}</span>
            <span className="hidden sm:inline text-xs font-normal opacity-90">
              {isPeekActive ? 'Спрятать' : 'Подглядеть'}
            </span>
          </button>

          {/* Кнопка "Сложнее ➡️" (активна если процент < 1.0) */}
          <button
            onClick={handleNextStep}
            disabled={percentage >= MAX_PERCENTAGE - 0.01}
            className={`flex-1 sm:flex-initial sm:min-w-[140px] px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              percentage < MAX_PERCENTAGE - 0.01
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 active:scale-95'
                : 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-900 text-stone-400'
            }`}
          >
            <span>Сложнее</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </div>

    </div>
  );
}

function maskCoreWord(core, symbol) {
  return core
    .split('')
    .map((char) => (/^\p{L}$/u.test(char) ? symbol : char))
    .join('');
}
