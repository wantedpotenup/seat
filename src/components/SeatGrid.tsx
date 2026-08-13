import type { Seat } from '../types';
import { SeatCard } from './SeatCard';

interface SeatGridProps {
  seats: Seat[];
  onSelect: (number: number) => void;
  readOnly?: boolean;
}

export function SeatGrid({ seats, onSelect, readOnly = false }: SeatGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-8 lg:grid-cols-10">
      {seats.map((seat) => (
        <SeatCard
          key={seat.number}
          seat={seat}
          onSelect={onSelect}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
