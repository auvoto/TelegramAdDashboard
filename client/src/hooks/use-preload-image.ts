export function usePreloadImage(src: string | undefined) {
  if (!src) return;
  
  const img = new Image();
  img.src = src;
  
  return {
    src,
    onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement;
      target.onerror = null; // Prevent infinite loop
      target.style.display = 'none';
    }
  };
}
