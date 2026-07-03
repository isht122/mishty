"use client";

import { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface SuccessToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function SuccessToast({ message, onClose, duration = 4000 }: SuccessToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-maroon/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-live="polite"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-card animate-scale-in text-center"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-text-muted transition-colors hover:bg-ivory-dark hover:text-maroon"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-maroon/10">
          <CheckCircle className="h-8 w-8 text-maroon" />
        </div>
        <h3 className="section-heading mb-2 text-xl font-semibold text-maroon">
          Success!
        </h3>
        <p className="text-text-muted whitespace-pre-line">{message}</p>
      </div>
    </div>
  );
}
