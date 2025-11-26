import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPersonaggiList, 
  getPersonaggioDetail, 
  getAcquirableSkills, 
  getAcquirableInfusioni, 
  getAcquirableTessiture, 
  getPunteggiList,
  getPersonaggioLogs,       
  getPersonaggioTransazioni 
} from '../api';

import { keepPreviousData } from '@tanstack/react-query'; 



// --- PUNTEGGI (Cache Globale Infinita) ---
export const usePunteggi = (onLogout) => {
  return useQuery({
    queryKey: ['punteggi'],
    queryFn: () => getPunteggiList(onLogout),
    staleTime: Infinity, // I punteggi non cambiano mai durante la sessione
    refetchOnWindowFocus: false,
  });
};

// --- LISTA PERSONAGGI ---
export const usePersonaggiList = (onLogout, viewAll) => {
  return useQuery({
    queryKey: ['personaggi_list', viewAll], // La chiave include i filtri
    queryFn: () => getPersonaggiList(onLogout, viewAll),
  });
};

// --- DETTAGLIO PERSONAGGIO ---
export const usePersonaggioDetail = (id, onLogout) => {
  return useQuery({
    queryKey: ['personaggio', id],
    queryFn: () => getPersonaggioDetail(id, onLogout),
    enabled: !!id, // Parte solo se c'è un ID
    staleTime: 1000 * 60 * 5, // 5 minuti di freschezza
  });
};

// --- ABILITÀ ACQUISTABILI ---
export const useAcquirableSkills = (id, onLogout) => {
  return useQuery({
    queryKey: ['abilita_acquistabili', id],
    queryFn: () => getAcquirableSkills(onLogout, id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// --- INFUSIONI ACQUISTABILI ---
export const useAcquirableInfusioni = (id) => {
  return useQuery({
    queryKey: ['infusioni_acquistabili', id],
    queryFn: () => getAcquirableInfusioni(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// --- TESSITURE ACQUISTABILI ---
export const useAcquirableTessiture = (id) => {
  return useQuery({
    queryKey: ['tessiture_acquistabili', id],
    queryFn: () => getAcquirableTessiture(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};



// ... Hook esistenti (usePunteggi, usePersonaggioDetail, etc.) ...

// --- HOOKS PER LOG E TRANSAZIONI PAGINATI ---

export const usePersonaggioLogs = (page = 1) => {
  return useQuery({
    queryKey: ['personaggio_logs', page],
    queryFn: () => getPersonaggioLogs(page),
    placeholderData: keepPreviousData, // Mantiene i dati vecchi finché i nuovi non arrivano (evita flickering)
    staleTime: 1000 * 60, // 1 minuto di cache
  });
};

export const useTransazioni = (page = 1, tipo = 'entrata') => {
  return useQuery({
    queryKey: ['personaggio_transazioni', tipo, page],
    queryFn: () => getPersonaggioTransazioni(page, tipo),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
};