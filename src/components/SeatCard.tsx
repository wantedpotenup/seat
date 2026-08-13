import type { Seat } from '../types';

interface SeatCardProps {
  seat: Seat;
  onSelect: (number: number) => void;
  readOnly?: boolean;
}

export function SeatCard({ seat, onSelect, readOnly = false }: SeatCardProps) {
  const taken = seat.name !== null;

  if (taken) {
    return (
      <div
        className="flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-sky-100 bg-sky-50 p-1 text-center shadow-inner"
        aria-label={`${seat.number}번, ${seat.name} 선택 완료`}
      >
        <span className="text-base font-bold leading-none text-slate-400 sm:text-2xl md:text-3xl">
          {seat.number}
        </span>
        <span className="w-full break-words px-1 text-xs font-semibold leading-tight text-blue-700 sm:text-lg md:text-xl">
          {seat.name}
        </span>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div
        className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-slate-100 bg-slate-50 p-1 text-center"
        aria-label={`${seat.number}번, 아직 선택되지 않음`}
      >
        <span className="text-lg font-bold text-slate-300 sm:text-2xl md:text-3xl">
          {seat.number}
        </span>
        <span className="mt-1 text-xs text-slate-300 sm:text-sm">미선택</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(seat.number)}
      className="flex aspect-square items-center justify-center rounded-xl border-2 border-blue-600 bg-blue-600 text-2xl font-bold text-white shadow-md transition hover:scale-105 hover:bg-blue-500 active:scale-95 sm:text-3xl md:text-4xl"
      aria-label={`${seat.number}번 선택 가능`}
    >
      {seat.number}
    </button>
  );
}
