import React from 'react';
import { BookOpen, PlusCircle, Settings, Moon, Sun, Coffee, Sparkles } from 'lucide-react';

export function Header({ currentView, setCurrentView, activePoem, theme, setTheme, onOpenSettings }) {
  const toggleTheme = () => {
    if (theme === 'light') setTheme('sepia');
    else if (theme === 'sepia') setTheme('dark');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-5 h-5 text-indigo-400" />;
    if (theme === 'sepia') return <Coffee className="w-5 h-5 text-amber-700" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getThemeTitle = () => {
    if (theme === 'dark') return 'Тёмная тема';
    if (theme === 'sepia') return 'Книжная тема (сепия)';
    return 'Светлая тема';
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-stone-50/90 dark:bg-stone-950/90 border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Логотип и Название */}
        <div 
          onClick={() => setCurrentView('library')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-xl tracking-tight text-stone-900 dark:text-stone-100">
                СтихоУм
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                Poetry
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
              Учим стихи наизусть по шагам
            </p>
          </div>
        </div>

        {/* Навигация */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentView('library')}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
              currentView === 'library'
                ? 'bg-amber-100/80 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-semibold shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Библиотека</span>
          </button>

          {activePoem && (
            <button
              onClick={() => setCurrentView('practice')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                currentView === 'practice'
                  ? 'bg-amber-100/80 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Учить</span>
            </button>
          )}

          <button
            onClick={() => setCurrentView('add')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              currentView === 'add'
                ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-500/30'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Добавить стих</span>
          </button>
        </nav>

        {/* Правые контролы: Тема и Настройки */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            title={getThemeTitle()}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            {getThemeIcon()}
          </button>

          <button
            onClick={onOpenSettings}
            title="Настройки"
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
}
