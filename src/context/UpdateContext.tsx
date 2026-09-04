import { createContext, useContext } from 'react';

type UpdateContextValue = {
  latestVersion: string | null;
  isDownloading: boolean;
  installUpdate: () => Promise<void>;
};

export const UpdateContext = createContext<UpdateContextValue | undefined>(undefined);

export function useUpdates() {
  const context = useContext(UpdateContext);
  if (!context) throw new Error('useUpdates deve ser usado dentro de UpdateContext.Provider.');
  return context;
}
