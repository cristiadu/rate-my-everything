import React from 'react'

/** Darker shade of the top menu's pink that outlines the filter panel and colors its tab. */
export const FILTER_PANEL_ACCENT = 'hsl(var(--bulma-danger-h), var(--bulma-danger-s), var(--bulma-danger-40-l))'

/** Width of the open filter panel, in pixels, border included. */
export const FILTER_PANEL_WIDTH = 300

interface ArrowProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
  /** Height of the fixed header above the panel, in pixels. */
  top: number;
}

/**
 * Tab that opens or closes the filter panel. It stays on screen while the panel is closed and rides along the panel's
 * right edge while it is open, level with the panel's heading.
 */
const Arrow: React.FC<ArrowProps> = ({ setIsOpen, isOpen, top }) => (
  <div
    onClick={() => setIsOpen(!isOpen)}
    onKeyDown={(event) => (event.key === 'Enter' ? setIsOpen(!isOpen) : null)}
    role="button"
    tabIndex={0}
    aria-label={isOpen ? 'Close filters' : 'Open filters'}
    className="has-text-white has-text-weight-bold is-flex is-align-items-center is-justify-content-center"
    style={{
      position: 'fixed',
      top: `calc(${top}px + 3rem)`,
      left: isOpen ? `${FILTER_PANEL_WIDTH}px` : '0',
      // Matches react-burger-menu's slide so the tab moves with the panel
      transition: 'left 0.5s',
      zIndex: 1101,
      width: '28px',
      height: '40px',
      borderRadius: '0 8px 8px 0',
      background: FILTER_PANEL_ACCENT,
      boxShadow: '2px 0 6px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      fontSize: '1.25rem',
    }}
  >
    {isOpen ? '‹' : '›'}
  </div>
)

export default Arrow
