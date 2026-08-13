import { Link } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { SeatGrid } from '../components/SeatGrid';
import { SeatLayoutGrid } from '../components/SeatLayoutGrid';

export function ResultsPage() {
  const { seats, loading, resultsRevealed, layout } = useAppData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-slate-400">불러오는 중...</p>
      </div>
    );
  }

  if (!resultsRevealed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
        <p className="text-lg font-semibold text-slate-700">
          아직 결과가 공개되지 않았습니다.
        </p>
        <p className="mt-2 text-slate-400">
          관리자가 결과를 공개하면 이 화면에서 확인할 수 있어요.
        </p>
        <Link
          to="/"
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          메인 화면으로
        </Link>
      </div>
    );
  }

  const hasCustomLayout = layout.rows.length > 0;

  return (
    <div className="min-h-screen bg-white px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
          자리 배정 결과
        </h1>

        {hasCustomLayout ? (
          <SeatLayoutGrid data={layout} seats={seats} />
        ) : (
          <SeatGrid seats={seats} onSelect={() => {}} readOnly />
        )}

        <div className="mt-10 text-center">
          <Link to="/" className="text-sm text-slate-400 hover:text-blue-600">
            메인 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}
