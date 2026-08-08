import { createContext, useContext } from 'react';

export interface PageTransitionContextType {
  navigateWithTransition: (to: string) => void;
}

export const PageTransitionContext = createContext<PageTransitionContextType>({
  navigateWithTransition: () => {},
});

export const usePageTransition = () => useContext(PageTransitionContext);
