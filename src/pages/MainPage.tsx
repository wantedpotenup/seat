import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { selectSeat } from '../lib/api';
import { SeatGrid } from '../components/SeatGrid';
import { ConfirmModal } from '../components/ConfirmModal';
import { NameInputModal } from '../components/NameInputModal';
import { ResultModal } from '../components/ResultModal';
import { Modal } from '../components/Modal';

type Flow =
  | { step: 'idle' }
  | { step: 'confirm'; number: number }
  | { step: 'name'; number: number }
  | { step: 'result'; number: number; name: string }
  | { step: 'conflict'; number: number };

export function MainPage() {
  const navigate = useNavigate();
  const { seats, loading, error, refresh, resultsRevealed } = useAppData();
  const [flow, setFlow] = useState<Flow>({ step: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const allTaken = useMemo(
    () => seats.length > 0 && seats.every((s) => s.name !== null),
    [seats]
  );

  function handleSelect(number: number) {
    setFlow({ step: 'confirm', number });
  }

  function handleConfirm() {
    if (flow.step !== 'confirm') return;
    setFlow({ step: 'name', number: flow.number });
  }

  async function handleNameSubmit(name: string) {
    if (flow.step !== 'name') return;
    setSubmitting(true);
    setNameError(null);

    try {
      const result = await selectSeat(flow.number, name);

      if (result.selected) {
        setFlow({ step: 'result', number: flow.number, name });
      } else {
        await refresh();
        setFlow({ step: 'conflict', number: flow.number });
      }
    } catch {
      setNameError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  function closeAll() {
    setFlow({ step: 'idle' });
    setNameError(null);
  }

  return (
    <div className="min-h-screen bg-white px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {allTaken && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-lg font-semibold text-blue-700 sm:text-xl">
            모든 번호가 선택되었습니다. 자리배치 결과를 확인해주세요.
          </div>
        )}

        {loading && (
          <p className="py-20 text-center text-slate-400">불러오는 중...</p>
        )}

        {error && (
          <p className="py-20 text-center text-red-600">
            데이터를 불러오지 못했습니다: {error}
          </p>
        )}

        {!loading && !error && seats.length === 0 && (
          <p className="py-20 text-center text-slate-400">
            아직 번호가 생성되지 않았습니다. 관리자에게 문의해주세요.
          </p>
        )}

        {!loading && !error && seats.length > 0 && (
          <SeatGrid seats={seats} onSelect={handleSelect} />
        )}

        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!resultsRevealed}
            onClick={() => navigate('/results')}
            className={
              resultsRevealed
                ? 'rounded-xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-blue-700'
                : 'cursor-not-allowed rounded-xl bg-slate-100 px-8 py-3 text-lg font-semibold text-slate-400'
            }
          >
            자리 확인하기
          </button>
          {!resultsRevealed && (
            <p className="text-xs text-slate-400">
              관리자가 결과를 공개하면 확인할 수 있어요.
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/admin" className="text-xs text-slate-400 hover:text-blue-600">
            관리자
          </Link>
        </div>
      </div>

      {flow.step === 'confirm' && (
        <ConfirmModal
          number={flow.number}
          onCancel={closeAll}
          onConfirm={handleConfirm}
        />
      )}

      {flow.step === 'name' && (
        <NameInputModal
          number={flow.number}
          submitting={submitting}
          errorMessage={nameError}
          onCancel={closeAll}
          onSubmit={handleNameSubmit}
        />
      )}

      {flow.step === 'result' && (
        <ResultModal
          number={flow.number}
          name={flow.name}
          onClose={closeAll}
        />
      )}

      {flow.step === 'conflict' && (
        <Modal onClose={closeAll}>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600">
              이미 선택된 번호입니다.
            </p>
            <p className="mt-2 text-slate-600">다른 번호를 선택해주세요.</p>
            <button
              type="button"
              onClick={closeAll}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
