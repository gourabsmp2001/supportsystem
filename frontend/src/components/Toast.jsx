import { CheckCircle2, Info, Loader2, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const icons = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
  loading: Loader2,
};

const colors = {
  success: 'border-emerald-400 bg-emerald-50 text-emerald-800',
  error: 'border-red-400 bg-red-50 text-red-800',
  info: 'border-sky-400 bg-sky-50 text-sky-800',
  loading: 'border-amber-400 bg-amber-50 text-amber-800',
};

let _dispatch = () => {};

export function toast(message, type = 'info', duration = 3500) {
  _dispatch({ message, type, duration, id: Date.now() + Math.random() });
}

toast.success = (msg, dur) => toast(msg, 'success', dur);
toast.error = (msg, dur) => toast(msg, 'error', dur ?? 5000);
toast.info = (msg, dur) => toast(msg, 'info', dur);
toast.loading = (msg) => toast(msg, 'loading', 0);

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    _dispatch = (t) => {
      setToasts((list) => [...list, t]);
      if (t.duration > 0) {
        timers.current[t.id] = setTimeout(() => remove(t.id), t.duration);
      }
    };
    return () => {
      _dispatch = () => {};
    };
  }, [remove]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[999] flex flex-col-reverse gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-right ${colors[t.type] || colors.info}`}
            role="alert"
          >
            <Icon size={18} className={`mt-0.5 flex-shrink-0 ${t.type === 'loading' ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium leading-snug">{t.message}</span>
            {t.duration !== 0 && (
              <button onClick={() => remove(t.id)} className="ml-2 flex-shrink-0 rounded p-0.5 opacity-60 hover:opacity-100" aria-label="Dismiss">
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
