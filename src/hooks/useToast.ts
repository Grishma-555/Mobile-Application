import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString();
    const toast: Toast = { id, type, message };
    
    setToasts(prev => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => addToast('success', message), [addToast]);
  const showError = useCallback((message: string) => addToast('error', message), [addToast]);
  const showWarning = useCallback((message: string) => addToast('warning', message), [addToast]);

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
  };
};