import { useEffect } from 'react';

export default function Alert({
  message,
  type = 'success', // success | error | warning | info
  onClose,
  duration = 3000
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-green-100 text-green-800 border-green-400',
    error: 'bg-red-100 text-red-800 border-red-400',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    info: 'bg-blue-100 text-blue-800 border-blue-400',
  };

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`border-l-4 p-4 rounded-lg shadow-lg min-w-[300px] ${styles[type]}`}
      >
        <div className="flex justify-between items-start gap-4">
          <p className="text-sm font-medium">{message}</p>
          <button
            onClick={onClose}
            className="text-lg font-bold leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
