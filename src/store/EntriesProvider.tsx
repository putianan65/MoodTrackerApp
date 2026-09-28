import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { scoreEntry } from '../domain/scoring';
import { loadEntries, persistEntries } from '../storage/entries';
import type { MoodEntry } from '../types/entry';

type EntriesContextValue = {
  entries: MoodEntry[];
  ready: boolean;
  getEntry: (date: string) => MoodEntry | undefined;
  /** Inserts or replaces the entry for `entry.date`, recomputing `totalScore`. */
  saveEntry: (entry: MoodEntry) => Promise<MoodEntry>;
  refresh: () => Promise<void>;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setEntries(await loadEntries());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getEntry = useCallback(
    (date: string) => entries.find((entry) => entry.date === date),
    [entries],
  );

  const saveEntry = useCallback(async (entry: MoodEntry) => {
    const next: MoodEntry = { ...entry, totalScore: scoreEntry(entry).total };
    // Read from storage rather than state so rapid consecutive saves never drop data.
    const stored = await loadEntries();
    const index = stored.findIndex((e) => e.date === next.date);
    const updated = index === -1 ? [...stored, next] : stored.map((e, i) => (i === index ? next : e));
    await persistEntries(updated);
    setEntries(updated);
    return next;
  }, []);

  const value = useMemo(
    () => ({ entries, ready, getEntry, saveEntry, refresh }),
    [entries, ready, getEntry, saveEntry, refresh],
  );

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries() {
  const context = useContext(EntriesContext);
  if (!context) throw new Error('useEntries must be used inside <EntriesProvider>');
  return context;
}
