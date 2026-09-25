"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[92dvh] w-[min(34rem,calc(100vw-1.5rem))] overflow-visible rounded-[var(--radius-card)] bg-transparent p-0 text-ink"
    >
      <div className="max-h-[92dvh] overflow-y-auto rounded-[var(--radius-card)] bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="btn-ghost size-9 rounded-full p-0" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
