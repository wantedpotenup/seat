export type LayoutCell =
  | { type: 'seat'; number: number }
  | { type: 'blocked' }
  | { type: 'empty' }
  | { type: 'label'; text: string };

export interface SeatLayoutData {
  title: string;
  rows: LayoutCell[][];
}

export const EMPTY_LAYOUT: SeatLayoutData = { title: '', rows: [] };

/**
 * 관리자가 입력한 텍스트를 좌석 배치도 데이터로 변환한다.
 * 한 줄 = 한 행, 쉼표(,) 또는 탭으로 셀을 구분한다.
 *   - 숫자        -> 해당 번호의 좌석
 *   - 빈 칸        -> 빈 공간(간격)
 *   - x, X, -     -> 사용 불가 칸 (통로/기둥 등)
 *   - 그 외 텍스트  -> 라벨 칸 (예: "강사")
 */
export function parseLayoutText(text: string): LayoutCell[][] {
  const lines = text.split(/\r?\n/);
  const rows: LayoutCell[][] = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const tokens = line.split(/\t|,/).map((t) => t.trim());
    const row: LayoutCell[] = tokens.map((token) => {
      if (token === '') return { type: 'empty' };
      if (/^\d+$/.test(token)) return { type: 'seat', number: Number(token) };
      if (token.toLowerCase() === 'x' || token === '-') return { type: 'blocked' };
      return { type: 'label', text: token };
    });
    rows.push(row);
  }

  return rows;
}

/** parseLayoutText 의 역변환 - 저장된 데이터를 다시 편집용 텍스트로 되돌린다. */
export function serializeLayoutRows(rows: LayoutCell[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          switch (cell.type) {
            case 'seat':
              return String(cell.number);
            case 'blocked':
              return 'X';
            case 'label':
              return cell.text;
            case 'empty':
            default:
              return '';
          }
        })
        .join(',')
    )
    .join('\n');
}
