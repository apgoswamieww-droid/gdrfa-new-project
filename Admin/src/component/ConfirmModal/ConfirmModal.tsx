import React from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

const TrashIcon = () => (
  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ConfirmModal = ({
  open, title, message, onConfirm, onCancel,
  confirmLabel = "Delete", cancelLabel = "Cancel", loading = false, children,
}: ConfirmModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-md">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <TrashIcon />
          </div>
          <h3 className="text-lg font-bold text-secondary mb-2">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
          {children}
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Removing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
