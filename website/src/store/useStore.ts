import { create } from 'zustand';

interface AppState {
  // Pricing toggle
  isAnnualPricing: boolean;
  togglePricing: () => void;

  // Active demo tab
  activeDemoTab: 'cli' | 'desktop' | 'web';
  setActiveDemoTab: (tab: 'cli' | 'desktop' | 'web') => void;

  // FAQ state
  openFaqIndex: number | null;
  toggleFaq: (index: number) => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Pricing
  isAnnualPricing: false,
  togglePricing: () => set((state) => ({ isAnnualPricing: !state.isAnnualPricing })),

  // Demo tabs
  activeDemoTab: 'cli',
  setActiveDemoTab: (tab) => set({ activeDemoTab: tab }),

  // FAQ
  openFaqIndex: null,
  toggleFaq: (index) => set((state) => ({
    openFaqIndex: state.openFaqIndex === index ? null : index
  })),

  // Mobile menu
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
