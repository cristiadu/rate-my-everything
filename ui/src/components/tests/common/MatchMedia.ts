/**
 * Stands in for window.matchMedia, which jsdom lacks, so every media query reports whether the window is as wide
 * as a desktop.
 */
export const mockDesktopWidth = (isDesktop: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: isDesktop,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  })
}
