import React from 'react';
import { X, Type, Sliders, Sparkles, RotateCcw, Download, Upload, ShieldAlert } from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDefaults,
  onExportLibrary,
  onImportLibrary,
}) {
  if (!isOpen) return null;

  const symbols = [
    { value: '▒', label: 'Блоки (▒)', desc: 'Классический символ из оригинального бота' },
    { value: '•', label: 'Точки (••••)', desc: 'Минималистичные аккуратные точки' },
    { value: '*', label: 'Звёздочки (****)', desc: 'Привычные маскировочные звёздочки' },
    { value: '_', label: 'Подчёркивания (____)', desc: 'Пропуски для заполнения' },
  ];

  const modes = [
    {
      value: 'cumulative',
      title: 'Накопительный (Рекомендуется)',
      desc: 'Слова, скрытые на шаге 1, остаются скрытыми на шаге 2. Лучше всего для памяти.',
    },
    {
      value: 'classic',
      title: 'Случайный (как в оригинальном боте)',
      desc: 'На каждом шаге выбираются случайные слова по проценту сложности.',
    },
    {
      value: 'rhyme',
      title: 'Тренировка рифм',
      desc: 'Скрываются рифмующиеся слова в конце строк.',
    },
    {
      value: 'first_words',
      title: 'Тренировка начал строк',
      desc: 'Скрываются первые слова строк — тренирует переход между строками.',
    },
  ];

  const fonts = [
    { value: 'lora', label: 'Lora (Книжный с засечками)', fontClass: 'font-["Lora",serif]' },
    { value: 'playfair', label: 'Playfair Display (Поэтический)', fontClass: 'font-["Playfair_Display",serif]' },
    { value: 'sans', label: 'Без засечек (Современный)', fontClass: 'font-sans' },
    { value: 'mono', label: 'Моноширинный (Терминал)', fontClass: 'font-mono' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto">
        
        {/* Шапка модального окна */}
        <div className="sticky top-0 bg-white dark:bg-stone-900 px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between z-10">
          <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Настройки изучения</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело настроек */}
        <div className="p-6 space-y-6 text-sm">
          
          {/* 1. Символ скрытия */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Символ маскировки слов
            </label>
            <div className="grid grid-cols-2 gap-2">
              {symbols.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onUpdateSettings({ symbol: s.value })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.symbol === s.value
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="font-mono text-base font-bold mb-0.5">{s.label}</div>
                  <div className="text-[11px] text-stone-500 line-clamp-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Алгоритм скрытия */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Режим скрытия слов
            </label>
            <div className="space-y-2">
              {modes.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    settings.mode === m.value
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m.value}
                    checked={settings.mode === m.value}
                    onChange={() => onUpdateSettings({ mode: m.value })}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">{m.title}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Шрифт для стихов */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Шрифт стихотворения
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fonts.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onUpdateSettings({ fontFamily: f.value })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.fontFamily === f.value
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className={`text-sm ${f.fontClass}`}>
                    {f.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Размер шрифта */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Размер шрифта
              </label>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                {settings.fontSize || 18} px
              </span>
            </div>
            <input
              type="range"
              min="14"
              max="26"
              step="1"
              value={settings.fontSize || 18}
              onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-stone-400 mt-1">
              <span>Мелкий (14px)</span>
              <span>Стандарт (18px)</span>
              <span>Крупный (26px)</span>
            </div>
          </div>

          {/* 5. Управление библиотекой и резервные копии */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
              Данные и резервное копирование
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportLibrary}
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Экспорт JSON</span>
              </button>

              <label className="cursor-pointer p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Импорт JSON</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result;
                      if (typeof content === 'string') {
                        onImportLibrary(content);
                        onClose();
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>

            <button
              onClick={() => {
                if (confirm('Сбросить библиотеку к начальным стихам? Ваши добавленные стихи могут быть стёрты.')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="w-full p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Восстановить золотую классику по умолчанию</span>
            </button>
          </div>

        </div>

        {/* Подвал модального окна */}
        <div className="sticky bottom-0 bg-stone-50 dark:bg-stone-900/90 px-6 py-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors"
          >
            Готово
          </button>
        </div>

      </div>
    </div>
  );
}
