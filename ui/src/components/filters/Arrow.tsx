import React from 'react'

/** Width of the open filter panel, in pixels, border included. */
export const FILTER_PANEL_WIDTH = 300

/** Stacking order of the tab, one above react-burger-menu's panel (1100) so the tab stays clickable on top of it. */
const FILTER_TAB_Z_INDEX = 1101

interface ArrowProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
  /** Height of the header above the panel, in pixels. */
  top: number;
  /** Whether the header stays pinned on screen; when it scrolls away, the tab scrolls away with it. */
  isHeaderPinned: boolean;
}

/**
 * Tab that opens or closes the filter panel. It sits right under the header and rides along the panel's right edge
 * while the panel is open, level with the panel's FILTERS label.
 */
const Arrow: React.FC<ArrowProps> = ({
  setIsOpen, isOpen, top, isHeaderPinned,
}) => (
  <div
    onClick={() => setIsOpen(!isOpen)}
    onKeyDown={(event) => (event.key === 'Enter' ? setIsOpen(!isOpen) : null)}
    role="button"
    tabIndex={0}
    aria-label={isOpen ? 'Close filters' : 'Open filters'}
    className="has-background-danger has-text-white has-text-weight-bold is-flex is-align-items-center is-justify-content-center"
    style={{
      position: isHeaderPinned ? 'fixed' : 'absolute',
      // Level with the panel's FILTERS label when the panel opens under the header, and closer to the header otherwise
      top: `calc(${top}px + ${isHeaderPinned ? '1.25rem' : '0.5rem'})`,
      left: isOpen ? `${FILTER_PANEL_WIDTH}px` : '0',
      // Matches react-burger-menu's slide so the tab moves with the panel
      transition: 'left 0.5s',
      zIndex: FILTER_TAB_Z_INDEX,
      width: '28px',
      height: '32px',
      borderRadius: '0 8px 8px 0',
      // Same shadow as the panel, so the tab reads as part of it
      boxShadow: '6px 0 12px rgba(0, 0, 0, 0.18)',
      cursor: 'pointer',
      fontSize: '1.25rem',
    }}
  >
    {isOpen ? '‹' : '›'}
  </div>
)

export default Arrow
