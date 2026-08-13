import { useCallback, useEffect, useRef, useState } from 'react';
import { getState } from '../lib/api';
import type { Seat } from '../types';
import { EMPTY_LAYOUT, type SeatLayoutData } from '../lib/seatLayout';

// Google Apps Script는 Supabase Realtime 같은 실시간 push가 없으므로,
// 짧은 주기로 다시 조회(polling)해서 실시간에 가깝게 흉내낸다.
const POLL_MS = 4000;

interface UseAppDataResult {
  seats: Seat[];
  totalSeats: number;
  resultsRevealed: boolean;
  layout: SeatLayoutData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAppData(): UseAppDataResult {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [totalSeats, setTotalSeats] = useState(0);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [layout, setLayout] = useState<SeatLayoutData>(EMPTY_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getState();
      setSeats(
        data.seats.map((s) => ({
          number: s.number,
          name: s.name,
          order_index: s.orderIndex,
          selected_at: s.selectedAt,
        }))
      );
      setTotalSeats(data.totalSeats);
      setResultsRevealed(data.resultsRevealed);
      setLayout({
        title: data.layout?.title ?? '',
        rows: (data.layout?.rows as SeatLayoutData['rows']) ?? [],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refresh]);

  return { seats, totalSeats, resultsRevealed, layout, loading, error, refresh };
}
