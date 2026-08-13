// Google Apps Script(Web App)를 백엔드로 사용한다. 배포된 웹 앱 URL을
// VITE_APPS_SCRIPT_URL 환경변수에 넣어야 한다 (apps-script/Code.gs, README 참고).

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

if (!APPS_SCRIPT_URL) {
  // eslint-disable-next-line no-console
  console.error(
    'VITE_APPS_SCRIPT_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요 (README.md 참고).'
  );
}

export interface RemoteSeat {
  number: number;
  name: string | null;
  orderIndex: number | null;
  selectedAt: string | null;
}

export interface RemoteLayout {
  title: string;
  rows: unknown[];
}

export interface AppStateResponse {
  seats: RemoteSeat[];
  totalSeats: number;
  resultsRevealed: boolean;
  layout: RemoteLayout;
}

export async function getState(): Promise<AppStateResponse> {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getState`);
  if (!res.ok) {
    throw new Error(`상태를 불러오지 못했습니다 (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (data?.error) {
    throw new Error(String(data.error));
  }
  return data as AppStateResponse;
}

// Apps Script 웹 앱은 CORS 프리플라이트(OPTIONS) 요청을 처리하지 못하므로,
// 프리플라이트를 유발하지 않는 text/plain 컨텐츠 타입으로 보낸다. 서버(Code.gs)는
// 어차피 본문을 JSON.parse 하므로 문제 없다.
async function post<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('VITE_APPS_SCRIPT_URL 환경변수가 설정되지 않았습니다.');
  }
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    throw new Error(`요청에 실패했습니다 (HTTP ${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface SelectSeatResult {
  selected: boolean;
  notFound: boolean;
  error?: string;
}

export function selectSeat(number: number, name: string) {
  return post<SelectSeatResult>('selectSeat', { number, name });
}

export interface AdminActionResult {
  ok?: boolean;
  error?: string;
}

export function adminAuthenticate(password: string) {
  return post<{ ok: boolean }>('adminAuthenticate', { password });
}

export function adminSetSeatCount(password: string, total: number) {
  return post<AdminActionResult>('adminSetSeatCount', { password, total });
}

export function adminResetSelections(password: string) {
  return post<AdminActionResult>('adminResetSelections', { password });
}

export function adminSetResultsRevealed(password: string, revealed: boolean) {
  return post<AdminActionResult>('adminSetResultsRevealed', { password, revealed });
}

export function adminSetSeatLayout(password: string, title: string, rows: unknown[]) {
  return post<AdminActionResult>('adminSetSeatLayout', { password, title, rows });
}
