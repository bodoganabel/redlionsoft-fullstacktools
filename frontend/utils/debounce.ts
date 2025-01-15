export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
) {
  let timeout: NodeJS.Timeout;

  const debouncedFunction = function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  debouncedFunction.clear = () => {
    clearTimeout(timeout);
  };

  return debouncedFunction;
}
