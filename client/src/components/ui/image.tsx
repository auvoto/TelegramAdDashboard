import { ImgHTMLAttributes } from 'react';

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export default function Image({ src, alt, ...props }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      {...props}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.style.display = 'none';
      }}
    />
  );
}
