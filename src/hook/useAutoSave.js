import { useRef, useCallback } from 'react';

/**
 * Custom hook để auto-save field sau khi user ngừng nhập
 * @param {Function} updateFunction - Hàm để cập nhật field
 * @param {number} delay - Thời gian delay (mặc định 2000ms)
 */
export const useAutoSave = (updateFunction, delay = 2000) => {
    const timeoutRef = useRef(null);

    const debouncedUpdate = useCallback((fieldName, value) => {
        // Clear timeout cũ nếu có
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set timeout mới
        timeoutRef.current = setTimeout(() => {
            updateFunction(fieldName, value);
        }, delay);
    }, [updateFunction, delay]);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    return { debouncedUpdate, cleanup };
};

export default useAutoSave;
