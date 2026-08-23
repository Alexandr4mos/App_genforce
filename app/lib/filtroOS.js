import { createContext, useContext, useMemo, useState } from 'react';
import { criarEstadoInicialFiltroData } from './dateRangeService';

const FiltroOSContext = createContext(null);

export function FiltroOSProvider({ children }) {
  const [dateFilter, setDateFilter] = useState(() => criarEstadoInicialFiltroData());
  const [filtroStatus, setFiltroStatus] = useState(null);

  const value = useMemo(
    () => ({
      dateFilter,
      setDateFilter,
      filtroStatus,
      setFiltroStatus,
      resetFiltros: () => {
        setDateFilter(criarEstadoInicialFiltroData());
        setFiltroStatus(null);
      },
    }),
    [dateFilter, filtroStatus]
  );

  return <FiltroOSContext.Provider value={value}>{children}</FiltroOSContext.Provider>;
}

export function useFiltroOS() {
  const ctx = useContext(FiltroOSContext);
  if (!ctx) {
    throw new Error('useFiltroOS precisa estar dentro de FiltroOSProvider');
  }
  return ctx;
}
