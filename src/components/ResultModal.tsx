import { Modal } from './Modal';

interface ResultModalProps {
  number: number;
  name: string;
  onClose: () => void;
}

export function ResultModal({ number, name, onClose }: ResultModalProps) {
  return (
    <Modal onClose={onClose}>
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">선택 완료!</p>
        <p className="mt-4 text-lg text-slate-700">{name}님의 번호는</p>
        <p className="my-3 text-6xl font-bold text-slate-900">{number}번</p>
        <p className="text-lg text-slate-700">입니다.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          확인
        </button>
      </div>
    </Modal>
  );
}
