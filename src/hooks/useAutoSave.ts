import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveProps<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  delay?: number; // Delay in milliseconds
  enabled?: boolean;
  key?: string; // Storage key for localStorage backup
}

export const useAutoSave = <T>({
  data,
  onSave,
  delay = 2000, // 2 seconds default
  enabled = true,
  key
}: UseAutoSaveProps<T>) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');
  const isInitialMount = useRef(true);

  const save = useCallback(async () => {
    if (!enabled) return;

    try {
      await onSave(data);
      
      // Save to localStorage if key is provided
      if (key) {
        localStorage.setItem(`autosave_${key}`, JSON.stringify(data));
      }
      
      // Update last saved data reference
      lastSavedDataRef.current = JSON.stringify(data);
      
      toast({
        title: "تم الحفظ التلقائي",
        description: "تم حفظ التغييرات تلقائياً",
        variant: "default"
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "فشل الحفظ التلقائي",
        description: "لم يتم حفظ التغييرات الأخيرة",
        variant: "destructive"
      });
    }
  }, [data, onSave, enabled, key, toast]);

  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if data has actually changed
    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedDataRef.current) {
      return; // No change, don't save
    }

    // Schedule new save
    timeoutRef.current = setTimeout(save, delay);
  }, [data, save, delay, enabled]);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedDataRef.current = JSON.stringify(data);
      return;
    }

    scheduleAutoSave();

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scheduleAutoSave]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  // Get recovery data from localStorage
  const getRecoveryData = useCallback((): T | null => {
    if (!key) return null;
    
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load recovery data:', error);
      return null;
    }
  }, [key]);

  // Clear recovery data
  const clearRecoveryData = useCallback(() => {
    if (key) {
      localStorage.removeItem(`autosave_${key}`);
    }
  }, [key]);

  return {
    saveNow,
    getRecoveryData,
    clearRecoveryData,
    hasUnsavedChanges: JSON.stringify(data) !== lastSavedDataRef.current
  };
};