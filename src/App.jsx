import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LibraryView } from './components/LibraryView';
import { PracticeView } from './components/PracticeView';
import { AddPoemWizard } from './components/AddPoemWizard';
import { SettingsModal } from './components/SettingsModal';
import { usePoetryLibrary } from './hooks/usePoetryLibrary';

const SETTINGS_KEY = 'stikhoum_settings_v1';
const THEME_KEY = 'stikhoum_theme_v1';

export function App() {
  const {
    poems,
    addPoem,
    updatePoem,
    deletePoem,
    toggleFavorite,
    updateProgress,
    exportLibrary,
    importLibrary,
    resetToDefaults,
  } = usePoetryLibrary();

  // Навигация: 'library', 'practice', 'add'
  const [currentView, setCurrentView] = useState('library');
  const [activePoemId, setActivePoemId] = useState(() => {
    return poems[0]?.id || null;
  });

  // Тема оформления: 'light', 'dark', 'sepia'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'light';
  });

  // Настройки
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      symbol: '▒',
      mode: 'cumulative', // 'cumulative' | 'classic' | 'rhyme' | 'first_words'
      fontFamily: 'lora', // 'lora' | 'playfair' | 'sans' | 'mono'
      fontSize: 18,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Применение темы к <html>
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const root = document.documentElement;

    root.classList.remove('dark', 'sepia-theme');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('sepia-theme');
    }
  }, [theme]);

  // Сохранение настроек
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Выбор стихотворения для изучения
  const handleSelectPoem = (poem) => {
    setActivePoemId(poem.id);
    setCurrentView('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Сохранение нового стиха из мастера
  const handleSaveNewPoem = (poemData, startLearningNow = false) => {
    const created = addPoem(poemData);
    if (startLearningNow) {
      setActivePoemId(created.id);
      setCurrentView('practice');
    } else {
      setCurrentView('library');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activePoem = poems.find((p) => p.id === activePoemId) || poems[0];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'sepia'
        ? 'bg-[#fbf0d9] text-[#433422]'
        : 'bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100'
    }`}>
      {/* Шапка приложения */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        activePoem={activePoem}
        theme={theme}
        setTheme={setTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Основная рабочая область */}
      <main className="flex-1">
        {currentView === 'library' && (
          <LibraryView
            poems={poems}
            onSelectPoem={handleSelectPoem}
            onAddNewPoem={() => setCurrentView('add')}
            onToggleFavorite={toggleFavorite}
            onDeletePoem={deletePoem}
            onExportLibrary={exportLibrary}
            onImportLibrary={(data) => {
              const res = importLibrary(data);
              if (res.success) {
                alert(`Успешно импортировано стихов: ${res.count}`);
              } else {
                alert(`Ошибка импорта: ${res.error}`);
              }
            }}
            onResetDefaults={resetToDefaults}
          />
        )}

        {currentView === 'practice' && activePoem && (
          <PracticeView
            poem={activePoem}
            onBackToLibrary={() => setCurrentView('library')}
            onToggleFavorite={toggleFavorite}
            onUpdateProgress={updateProgress}
            settings={settings}
          />
        )}

        {currentView === 'add' && (
          <AddPoemWizard
            onSavePoem={handleSaveNewPoem}
            onCancel={() => setCurrentView('library')}
          />
        )}
      </main>

      {/* Модальное окно настроек */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetDefaults={resetToDefaults}
        onExportLibrary={exportLibrary}
        onImportLibrary={(data) => {
          const res = importLibrary(data);
          if (res.success) {
            alert(`Успешно импортировано стихов: ${res.count}`);
          } else {
            alert(`Ошибка импорта: ${res.error}`);
          }
        }}
      />
    </div>
  );
}

export default App;
