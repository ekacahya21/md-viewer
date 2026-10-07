import { useState, useEffect, useCallback, useRef } from 'react';
import type { SummaryData, Language } from '../types';
import { translations } from '../i18n/translations.ts';

const CACHE_PREFIX = 'md_summary_v1_';

export function getContentSignature(text: string): string {
  return `${text.length}_${text.slice(0, 80)}_${text.slice(-80)}`;
}

export function getCachedSummary(sig: string): SummaryData | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${sig}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.tldr === 'string' && Array.isArray(parsed.takeaways)) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

export function setCachedSummary(sig: string, data: SummaryData) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${sig}`, JSON.stringify(data));
  } catch {}
}

export function removeCachedSummary(sig: string) {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${sig}`);
  } catch {}
}

export interface UseDocumentSummaryReturn {
  data: SummaryData | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  isReady: boolean;
  error: string | null;
  refresh: () => void;
  signature: string;
}

export function useDocumentSummary(
  content: string,
  title: string,
  language: Language = 'en',
  enabled: boolean = true
): UseDocumentSummaryReturn {
  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];
  const cachedSignatureRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const signature = getContentSignature(content);

  const executeFetch = useCallback(
    async (sig: string, force = false) => {
      if (!enabled) {
        setIsLoading(false);
        setIsAnalyzing(false);
        return;
      }

      if (!force && cachedSignatureRef.current === sig && data) {
        return;
      }

      if (!content || content.trim().length < 30) {
        setData(null);
        setError(t.summaryDrawer.tooShort);
        setIsLoading(false);
        setIsAnalyzing(false);
        return;
      }

      // Check cache if not forced
      if (!force) {
        const cached = getCachedSummary(sig);
        if (cached) {
          setData(cached);
          cachedSignatureRef.current = sig;
          setIsLoading(false);
          setIsAnalyzing(false);
          setError(null);
          return;
        }
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsAnalyzing(true);
      setError(null);

      try {
        const res = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, title }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (!json.success || !json.tldr) {
          throw new Error(language === 'id' ? 'Format ringkasan AI tidak valid.' : 'Invalid AI summary format.');
        }

        const result: SummaryData = {
          tldr: json.tldr,
          takeaways: json.takeaways || [],
        };

        setData(result);
        cachedSignatureRef.current = sig;
        setCachedSummary(sig, result);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.warn('AI summarize request error:', err);
        setError(
          err instanceof Error
            ? err.message
            : (language === 'id' ? 'Gagal menghubungi layanan ringkasan AI.' : 'Failed to contact AI summary service.')
        );
      } finally {
        setIsLoading(false);
        setIsAnalyzing(false);
      }
    },
    [content, title, data, language, t.summaryDrawer.tooShort, enabled]
  );

  // Background summarization on content change
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsLoading(false);
      setIsAnalyzing(false);
      return;
    }

    const sig = getContentSignature(content);

    // If current data matches signature, nothing to do
    if (cachedSignatureRef.current === sig && data) {
      return;
    }

    // Check instant cache hit
    const cached = getCachedSummary(sig);
    if (cached) {
      setData(cached);
      cachedSignatureRef.current = sig;
      setIsLoading(false);
      setIsAnalyzing(false);
      setError(null);
      return;
    }

    if (!content || content.trim().length < 30) {
      setData(null);
      setError(null);
      setIsLoading(false);
      setIsAnalyzing(false);
      return;
    }

    // Debounce background summarization
    setIsLoading(true);
    setIsAnalyzing(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      executeFetch(sig, false);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, executeFetch, data, enabled]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refresh = useCallback(() => {
    if (!enabled) return;
    const sig = getContentSignature(content);
    removeCachedSummary(sig);
    setIsLoading(true);
    executeFetch(sig, true);
  }, [content, executeFetch, enabled]);

  return {
    data,
    isLoading,
    isAnalyzing,
    isReady: enabled && data !== null,
    error,
    refresh,
    signature,
  };
}
