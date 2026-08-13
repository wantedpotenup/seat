import { useState } from 'react';
import { Modal } from './Modal';

interface NameInputModalProps {
  number: number;
  submitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

export function NameInputModal({
  number,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: NameInputModalProps) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <Modal onClose={submitting ? undefined : onCancel}>
      <form
        className="text-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) onSubmit(trimmed);
        }}
      >
        <p className="text-lg text-slate-700">
          <span className="font-bold text-blue-600">{number}번</span>을
          선택했습니다.
        </p>
        <p className="mt-1 text-slate-500">이름을 입력해주세요.</p>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          maxLength={20}
          disabled={submitting}
          className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />

        {errorMessage && (
          <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-xl bg-slate-100 py-3 text-lg font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!trimmed || submitting}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '처리 중...' : '선택 완료'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
