import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { MoodEntry } from '../types';
import { getAllEntries, saveNewEntry } from '../utils/historyStorage';

type MoodContextType = {
  entries: MoodEntry[];
  addEntry: (entry: MoodEntry) => Promise<void>;
};

export const MoodContext = createContext<MoodContextType>({
  entries: [],
  addEntry: async () => {},
});

export const MoodProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    const fetchEntries = async () => {
      const data = await getAllEntries();
      setEntries(data);
    };
    fetchEntries();
  }, []);

  const addEntry = async (entry: MoodEntry) => {
    await saveNewEntry(entry);
    setEntries((prev) => [...prev, entry]);
  };

  return (
    <MoodContext.Provider value={{ entries, addEntry }}>
      {children}
    </MoodContext.Provider>
  );
};
