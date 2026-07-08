import fallbackLogo from '@/assets/logoweb.png';
import { usePublicWebsiteConfig } from '@/hooks/useWebsiteConfig';

export { fallbackLogo };

export function useBrandLogoSrc() {
  const { data } = usePublicWebsiteConfig();
  return data?.logoUrl || fallbackLogo;
}
