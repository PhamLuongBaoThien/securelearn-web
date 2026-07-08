import type { ImgHTMLAttributes } from 'react';
import { fallbackLogo, useBrandLogoSrc } from './useBrandLogoSrc';

type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;

export function BrandLogo({ alt = 'SecureLearn logo', onError, ...props }: BrandLogoProps) {
  const src = useBrandLogoSrc();

  return <img {...props} src={src} alt={alt} onError={(event) => {
    if (event.currentTarget.src !== fallbackLogo) event.currentTarget.src = fallbackLogo;
    onError?.(event);
  }} />;
}
