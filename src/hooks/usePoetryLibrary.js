import { useState, useEffect } from 'react';
import { DEFAULT_POEMS } from '../data/defaultPoems';

const STORAGE_KEY = 'stikhoum_library_v1';

export function usePoetryLibrary() {
  const [poems, setPoems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Ошибка чтения библиотеки из localStorage:', e);
    }
    return DEFAULT_POEMS;
  });

  // Синхронизация с localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(poems));
    } catch (e) {
      console.error('Ошибка записи библиотеки в localStorage:', e);
    }
  }, [poems]);

  /**
   * Добавление нового стихотворения
   */
  const addPoem = (poemData) => {
    const newId = 'poem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newPoem = {
      id: newId,
      title: poemData.title?.trim() || 'Без названия',
      author: poemData.author?.trim() || 'Неизвестный автор',
      year: poemData.year?.trim() || '',
      category: poemData.category?.trim() || 'Мои стихи',
      text: poemData.text?.trim() || '',
      isFavorite: false,
      progressPercentage: 0.1,
      isMastered: false,
      createdAt: new Date().toISOString(),
      lastPracticedAt: null,
    };

    setPoems((prev) => [newPoem, ...prev]);
    return newPoem;
  };

  /**
   * Обновление существующего стихотворения
   */
  const updatePoem = (id, updates) => {
    setPoems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  /**
   * Удаление стихотворения
   */
  const deletePoem = (id) => {
    setPoems((prev) => prev.filter((p) => p.id !== id));
  };

  /**
   * Переключение избранного
   */
  const toggleFavorite = (id) => {
    setPoems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  /**
   * Обновление прогресса изучения стихотворения
   */
  const updateProgress = (id, percentage, isMastered = false) => {
    setPoems((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              progressPercentage: percentage,
              isMastered: isMastered ? true : p.isMastered,
              lastPracticedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  /**
   * Экспорт всей библиотеки в файл JSON
   */
  const exportLibrary = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(poems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `stikhoum_library_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  /**
   * Импорт библиотеки из JSON
   */
  const importLibrary = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        throw new Error('Данные должны быть массивом стихотворений');
      }

      // Валидация базовых полей
      const validPoems = data.filter((item) => item && item.title && item.text);
      if (validPoems.length === 0) {
        throw new Error('В файле не найдено корректных стихотворений');
      }

      setPoems(validPoems);
      return { success: true, count: validPoems.length };
    } catch (err) {
      console.error('Ошибка импорта:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Сброс библиотеки к начальным шедеврам
   */
  const resetToDefaults = () => {
    setPoems(DEFAULT_POEMS);
  };

  return {
    poems,
    addPoem,
    updatePoem,
    deletePoem,
    toggleFavorite,
    updateProgress,
    exportLibrary,
    importLibrary,
    resetToDefaults,
  };
}
