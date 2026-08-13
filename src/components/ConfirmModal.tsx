import { Modal } from './Modal';

interface ConfirmModalProps {
  number: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ number, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <Modal onClose={onCancel}>
      <div className="text-center">
        <p className="text-lg text-slate-500">선택한 번호</p>
        <p className="my-4 text-6xl font-bold text-slate-900">{number}번</p>
        <p className="text-lg text-slate-700">이 번호를 선택하시겠습니까?</p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 py-3 text-lg font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
          >
            선택하기
          </button>
        </div>
      </div>
    </Modal>
  );
}
