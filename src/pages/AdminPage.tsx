import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { parseLayoutText, serializeLayoutRows } from '../lib/seatLayout';
import {
  adminAuthenticate,
  adminResetSelections,
  adminSetResultsRevealed,
  adminSetSeatCount,
  adminSetSeatLayout,
} from '../lib/api';
import { Modal } from '../components/Modal';
import { SeatLayoutGrid } from '../components/SeatLayoutGrid';

const LAYOUT_PLACEHOLDER = `16,7,25,,8,19,X
4,23,13,,3,10,22
20,11,21,,2,24,14
9,17,5,,12,18,6
X,X,1,,15,X`;

export function AdminPage() {
  const { seats, loading, refresh, resultsRevealed, layout } = useAppData();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authing, setAuthing] = useState(false);

  const [newTotal, setNewTotal] = useState('30');
  const [pendingAction, setPendingAction] = useState<
    null | 'setCount' | 'resetSelections'
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [layoutTitle, setLayoutTitle] = useState('');
  const [layoutText, setLayoutText] = useState('');
  const [layoutSaved, setLayoutSaved] = useState(false);
  const layoutFormInitialized = useRef(false);

  // 서버에서 처음 데이터가 로드될 때 한 번만 입력창을 채운다. 4초마다 다시
  // 조회(polling)하는데, 매번 덮어쓰면 관리자가 입력 중인 내용이 사라지므로
  // 최초 로드 이후에는 동기화하지 않는다 (저장은 "배치도 저장" 버튼으로만).
  useEffect(() => {
    if (loading || layoutFormInitialized.current) return;
    layoutFormInitialized.current = true;
    setLayoutTitle(layout.title ?? '');
    setLayoutText(serializeLayoutRows(layout.rows ?? []));
  }, [loading, layout]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthing(true);
    setAuthError(null);
    try {
      const res = await adminAuthenticate(password);
      if (!res.ok) {
        setAuthError('비밀번호가 올바르지 않습니다.');
        return;
      }
      setAuthed(true);
    } catch {
      setAuthError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAuthing(false);
    }
  }

  async function runSetCount() {
    setActionBusy(true);
    setActionError(null);
    const total = Number(newTotal);
    try {
      const res = await adminSetSeatCount(password, total);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      await refresh();
    } catch {
      setActionError('요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setActionBusy(false);
      setPendingAction(null);
    }
  }

  async function runResetSelections() {
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await adminResetSelections(password);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      await refresh();
    } catch {
      setActionError('요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setActionBusy(false);
      setPendingAction(null);
    }
  }

  async function saveLayout() {
    setActionBusy(true);
    setActionError(null);
    setLayoutSaved(false);
    const rows = parseLayoutText(layoutText);
    try {
      const res = await adminSetSeatLayout(password, layoutTitle.trim(), rows);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      await refresh();
      setLayoutSaved(true);
    } catch {
      setActionError('요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setActionBusy(false);
    }
  }

  async function toggleResultsRevealed() {
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await adminSetResultsRevealed(password, !resultsRevealed);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      await refresh();
    } catch {
      setActionError('요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setActionBusy(false);
    }
  }

  const selected = seats
    .filter((s) => s.name !== null)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const previewLayout = useMemo(
    () => ({ title: layoutTitle, rows: parseLayoutText(layoutText) }),
    [layoutTitle, layoutText]
  );

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 shadow-lg"
        >
          <h1 className="text-center text-xl font-bold text-slate-900">
            관리자 로그인
          </h1>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            disabled={authing}
            className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {authError && (
            <p className="mt-3 text-center text-sm font-medium text-red-600">
              {authError}
            </p>
          )}
          <button
            type="submit"
            disabled={!password || authing}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {authing ? '확인 중...' : '로그인'}
          </button>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-blue-600">
              메인 화면으로
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">관리자 화면</h1>
          <Link to="/" className="text-sm text-slate-500 hover:text-blue-600">
            메인 화면으로
          </Link>
        </div>

        {actionError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
            {actionError}
          </p>
        )}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-slate-900">좌석(번호) 개수 설정</h2>
          <p className="mt-1 text-sm text-slate-500">
            현재 {seats.length}개 번호가 생성되어 있습니다. 개수를 변경하면
            모든 선택 결과가 초기화됩니다.
          </p>
          <div className="mt-4 flex gap-3">
            <input
              type="number"
              min={1}
              max={500}
              value={newTotal}
              onChange={(e) => setNewTotal(e.target.value)}
              className="w-32 rounded-xl border border-slate-300 px-4 py-2 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={() => setPendingAction('setCount')}
              className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              생성 / 초기화
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-slate-900">좌석 배치도 설정</h2>
          <p className="mt-1 text-sm text-slate-500">
            실제 교육장 모양대로 번호를 배치해두면, "자리 확인하기" 결과
            화면에서 이 모양 그대로(이름 포함) 보여줍니다. 설정하지 않으면
            번호 순서대로 나열된 기본 화면이 표시됩니다.
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            상단 제목 (선택)
          </label>
          <input
            type="text"
            value={layoutTitle}
            onChange={(e) => {
              setLayoutTitle(e.target.value);
              setLayoutSaved(false);
            }}
            placeholder="예: 4F 교육장 앞"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <label className="mt-4 block text-sm font-medium text-slate-700">
            배치도 (한 줄 = 한 행, 쉼표로 칸 구분)
          </label>
          <p className="mt-1 text-xs text-slate-400">
            숫자= 좌석 번호 · 빈 칸 = 공백(통로) · X = 사용 불가 칸 · 그 외
            텍스트 = 라벨(예: 강사)
          </p>
          <textarea
            value={layoutText}
            onChange={(e) => {
              setLayoutText(e.target.value);
              setLayoutSaved(false);
            }}
            placeholder={LAYOUT_PLACEHOLDER}
            rows={6}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={saveLayout}
              disabled={actionBusy}
              className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {actionBusy ? '저장 중...' : '배치도 저장'}
            </button>
            {layoutSaved && (
              <span className="text-sm font-medium text-blue-600">저장되었습니다.</span>
            )}
          </div>

          {previewLayout.rows.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold text-slate-400">미리보기</p>
              <SeatLayoutGrid data={previewLayout} seats={seats} />
            </div>
          )}
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-slate-900">결과 공개</h2>
          <p className="mt-1 text-sm text-slate-500">
            공개하면 참가자들이 메인 화면의 "자리 확인하기" 버튼으로 전체
            배정 결과(번호+이름)를 볼 수 있습니다. 좌석 개수를 다시 설정하거나
            전체 초기화하면 자동으로 비공개로 전환됩니다.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`text-sm font-semibold ${
                resultsRevealed ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {resultsRevealed ? '공개 중' : '비공개'}
            </span>
            <button
              type="button"
              onClick={toggleResultsRevealed}
              disabled={actionBusy}
              className={
                resultsRevealed
                  ? 'rounded-xl bg-slate-100 px-5 py-2 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50'
                  : 'rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50'
              }
            >
              {resultsRevealed ? '비공개로 전환' : '결과 공개하기'}
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">전체 선택 현황</h2>
            <span className="text-sm text-slate-500">
              {selected.length} / {seats.length}명 선택 완료
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-slate-500">불러오는 중...</p>
          ) : selected.length === 0 ? (
            <p className="mt-4 text-slate-500">아직 선택한 사람이 없습니다.</p>
          ) : (
            <div className="mt-4 max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2">순서</th>
                    <th className="py-2 pr-2">이름</th>
                    <th className="py-2 pr-2">번호</th>
                    <th className="py-2 pr-2">선택 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((s, i) => (
                    <tr key={s.number} className="border-b border-slate-100">
                      <td className="py-2 pr-2 text-slate-600">{i + 1}</td>
                      <td className="py-2 pr-2 font-medium text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-2 pr-2 text-slate-600">{s.number}번</td>
                      <td className="py-2 pr-2 text-slate-500">
                        {s.selected_at
                          ? new Date(s.selected_at).toLocaleString('ko-KR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-slate-900">전체 초기화</h2>
          <p className="mt-1 text-sm text-slate-500">
            번호는 그대로 유지되고, 모든 선택 결과(이름/순서/시간)만
            삭제됩니다. 새로운 과정을 시작할 때 사용하세요.
          </p>
          <button
            type="button"
            onClick={() => setPendingAction('resetSelections')}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            전체 초기화
          </button>
        </section>
      </div>

      {pendingAction === 'setCount' && (
        <Modal onClose={() => setPendingAction(null)}>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">
              번호를 1 ~ {newTotal}번으로 새로 생성하시겠습니까?
            </p>
            <p className="mt-2 text-slate-600">
              기존의 모든 선택 결과가 삭제됩니다.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actionBusy}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={runSetCount}
                disabled={actionBusy}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {actionBusy ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pendingAction === 'resetSelections' && (
        <Modal onClose={() => setPendingAction(null)}>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">
              모든 선택 결과를 초기화하시겠습니까?
            </p>
            <p className="mt-2 text-slate-600">
              이름, 선택 번호, 순서가 모두 삭제됩니다. 번호 자체는 유지됩니다.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actionBusy}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={runResetSelections}
                disabled={actionBusy}
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700"
              >
                {actionBusy ? '처리 중...' : '초기화'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
