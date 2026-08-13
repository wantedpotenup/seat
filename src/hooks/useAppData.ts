import { useCallback, useEffect, useState } from 'react';
import { getState } from '../lib/api';
import type { Seat } from '../types';
import { EMPTY_LAYOUT, type SeatLayoutData } from '../lib/seatLayout';

// Google Apps Script는 Supabase Realtime 같은 실시간 push가 없으므로,
// 짧은 주기로 다시 조회(polling)해서 실시간에 가깝게 흉내낸다.
// 참가자가 많을 때(예: 40명) 모두가 정확히 같은 타이밍에 요청을 보내면
// 그 순간 서버가 몰리므로, 매번 약간의 무작위 오차(jitter)를 더해서
// 요청 시점을 자연스럽게 분산시킨다. (참고: 서버 쪽 캐시 유지시간
// (apps-script/Code.gs 의 STATE_CACHE_TTL_SECONDS)은 이 값 이상으로
// 맞춰둬야 캐시가 제 역할을 한다.)
const POLL_MS = 6000;
const POLL_JITTER_MS = 2000;

function nextPollDelay() {
  return POLL_MS + Math.floor(Math.random() * POLL_JITTER_MS);
}

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
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // setInterval 대신, 매 요청이 끝난 뒤에만 다음 요청을 예약하는 방식을
    // 쓴다. 이렇게 하면 (1) 응답이 느려져도 요청이 겹쳐서 쌓이지 않고,
    // (2) 매번 무작위 간격(jitter)을 더할 수 있어 여러 명이 동시에 접속해도
    // 요청이 한 순간에 몰리지 않는다.
    async function tick() {
      await refresh();
      if (cancelled) return;
      timer = setTimeout(tick, nextPollDelay());
    }

    // 첫 조회도 아주 살짝 무작위로 지연시켜서, 여러 명이 정확히 같은
    // 순간에 페이지를 열어도(예: 안내 방송과 동시에) 서버 요청이 한꺼번에
    // 몰리지 않도록 한다.
    const initialDelay = Math.floor(Math.random() * 400);
    timer = setTimeout(tick, initialDelay);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [refresh]);

  return { seats, totalSeats, resultsRevealed, layout, loading, error, refresh };
}
