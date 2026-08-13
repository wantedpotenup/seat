import type { Seat } from '../types';
import type { LayoutCell, SeatLayoutData } from '../lib/seatLayout';

interface SeatLayoutGridProps {
  data: SeatLayoutData;
  seats: Seat[];
}

function Cell({ cell, seats }: { cell: LayoutCell; seats: Seat[] }) {
  if (cell.type === 'empty') {
    return <div />;
  }

  if (cell.type === 'blocked') {
    return <div className="aspect-square rounded-lg bg-slate-800" aria-hidden="true" />;
  }

  if (cell.type === 'label') {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-1 text-center text-xs font-semibold text-slate-500 sm:text-sm">
        {cell.text}
      </div>
    );
  }

  const seat = seats.find((s) => s.number === cell.number);
  const name = seat?.name ?? null;

  if (name) {
    return (
      <div
        className="flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-sky-100 bg-sky-50 p-0.5 text-center sm:p-1"
        aria-label={`${cell.number}번, ${name}`}
      >
        <span className="text-[10px] font-bold leading-none text-slate-400 sm:text-sm md:text-lg">
          {cell.number}
        </span>
        <span className="w-full break-words px-0.5 text-[11px] font-semibold leading-[1.1] text-blue-700 sm:text-sm md:text-base">
          {name}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-400 sm:text-base md:text-lg"
      aria-label={`${cell.number}번, 미선택`}
    >
      {cell.number}
    </div>
  );
}

export function SeatLayoutGrid({ data, seats }: SeatLayoutGridProps) {
  const maxCols = Math.max(1, ...data.rows.map((row) => row.length));

  return (
    <div>
      {data.title && (
        <div className="mb-4 rounded-lg bg-slate-900 py-3 text-center text-base font-bold text-white sm:text-lg">
          {data.title}
        </div>
      )}

      <div className="overflow-x-auto">
        <div
          className="flex flex-col gap-1.5 sm:gap-2"
          style={{ minWidth: maxCols * 68 }}
        >
          {data.rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-1.5 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}
            >
              {row.map((cell, cellIndex) => (
                <Cell key={cellIndex} cell={cell} seats={seats} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
