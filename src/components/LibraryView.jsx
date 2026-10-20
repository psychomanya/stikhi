import React, { useState } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  Sparkles,
  Heart,
  Trash2,
  Edit,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { calculatePoemStats } from '../utils/formatter';

export function LibraryView({
  poems,
  onSelectPoem,
  onAddNewPoem,
  onToggleFavorite,
  onDeletePoem,
  onExportLibrary,
  onImportLibrary,
  onResetDefaults,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'favorites', 'in_progress', 'mastered'

  // Фильтрация стихотворений
  const filteredPoems = poems.filter((poem) => {
    // Текстовый поиск
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      poem.title.toLowerCase().includes(query) ||
      poem.author.toLowerCase().includes(query) ||
      poem.text.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Вкладки
    if (filterType === 'favorites') return poem.isFavorite;
    if (filterType === 'in_progress') return poem.progressPercentage > 0.1 && !poem.isMastered;
    if (filterType === 'mastered') return poem.isMastered;

    return true;
  });

  const favoritesCount = poems.filter((p) => p.isFavorite).length;
  const inProgressCount = poems.filter((p) => p.progressPercentage > 0.1 && !p.isMastered).length;
  const masteredCount = poems.filter((p) => p.isMastered).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">
      
      {/* Заголовок и кнопка создания */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
            Библиотека стихотворений
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Коллекция ваших произведений для заучивания и повторения
          </p>
        </div>

        <button
          onClick={onAddNewPoem}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-500/25 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить стих</span>
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Поисковая строка */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, автору или строкам..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs"
          />
        </div>

        {/* Табы фильтров */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Все ({poems.length})
          </button>

          <button
            onClick={() => setFilterType('favorites')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              filterType === 'favorites'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Избранные ({favoritesCount})</span>
          </button>

          <button
            onClick={() => setFilterType('in_progress')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              filterType === 'in_progress'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>В процессе ({inProgressCount})</span>
          </button>

          <button
            onClick={() => setFilterType('mastered')}
            className={`px-3 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              filterType === 'mastered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Выучено ({masteredCount})</span>
          </button>
        </div>
      </div>

      {/* Сетка карточек стихотворений */}
      {filteredPoems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPoems.map((poem) => {
            const stats = calculatePoemStats(poem.text);
            const firstLines = poem.text
              .split('\n')
              .filter((l) => l.trim() !== '')
              .slice(0, 3)
              .join('\n');

            const percentage = Math.round((poem.progressPercentage || 0.1) * 100);

            return (
              <div
                key={poem.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div>
                  {/* Верх карточки: Категория и кнопка Избранного */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                      {poem.category || 'Стихотворение'}
                    </span>

                    <button
                      onClick={() => onToggleFavorite(poem.id)}
                      title={poem.isFavorite ? 'Убрать из избранного' : 'В избранное'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        poem.isFavorite
                          ? 'text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/60'
                          : 'text-stone-300 dark:text-stone-600 hover:text-rose-400'
                      }`}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Название и автор */}
                  <h3
                    onClick={() => onSelectPoem(poem)}
                    className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer line-clamp-1 transition-colors"
                  >
                    {poem.title}
                  </h3>

                  <p className="text-xs font-serif italic text-stone-500 dark:text-stone-400 mb-3">
                    {poem.author} {poem.year ? `(${poem.year})` : ''}
                  </p>

                  {/* Превью строк */}
                  <div
                    onClick={() => onSelectPoem(poem)}
                    className="cursor-pointer text-xs font-serif text-stone-600 dark:text-stone-400 italic line-clamp-3 leading-relaxed mb-4 p-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80"
                  >
                    {firstLines}
                  </div>
                </div>

                {/* Низ карточки: Прогресс и Кнопка "Учить" */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                      {stats.linesCount} строк • {stats.stanzasCount} строф
                    </span>

                    {poem.isMastered ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Выучено!</span>
                      </span>
                    ) : (
                      <span className="text-stone-600 dark:text-stone-300 font-medium text-[11px]">
                        Сложность: {percentage}%
                      </span>
                    )}
                  </div>

                  {/* Тонкий прогресс-бар */}
                  <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        poem.isMastered
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-amber-500 to-indigo-600'
                      }`}
                      style={{ width: `${poem.isMastered ? 100 : percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectPoem(poem)}
                      className="flex-1 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-stone-800 hover:bg-indigo-600 text-indigo-700 dark:text-stone-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-indigo-200/60 dark:border-stone-700 hover:border-transparent"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Учить стихотворение</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Удалить стихотворение «${poem.title}» из библиотеки?`)) {
                          onDeletePoem(poem.id);
                        }
                      }}
                      title="Удалить"
                      className="p-2 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Пустое состояние */
        <div className="text-center py-16 px-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200 mb-1">
            Стихотворения не найдены
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-6">
            {searchQuery
              ? 'По вашему поисковому запросу ничего не нашлось. Попробуйте изменить формулировку.'
              : 'В этом разделе пока нет стихотворений. Добавьте своё первое произведение!'}
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onAddNewPoem}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors"
            >
              Добавить своё стихотворение
            </button>

            {poems.length === 0 && (
              <button
                onClick={onResetDefaults}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium transition-colors"
              >
                Загрузить золотую классику
              </button>
            )}
          </div>
        </div>
      )}

      {/* Нижняя панель резервного копирования */}
      <div className="mt-10 p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <div>
          <span>💾 Ваши стихи сохраняются в памяти браузера.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportLibrary}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт JSON</span>
          </button>

          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 font-medium flex items-center gap-1.5 transition-colors">
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
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>

    </div>
  );
}
