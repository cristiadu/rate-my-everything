import React from 'react'

interface ArrowProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
}

const Arrow: React.FC<ArrowProps> = ({ setIsOpen, isOpen }) => (
  <div
    onClick={() => setIsOpen(!isOpen)}
    onKeyDown={(event) => (event.key === 'Enter' ? setIsOpen(!isOpen) : null)}
    role="presentation"
    style={{
      position: 'absolute',
      top: '10px',
      right: '-20px',
      width: '0',
      height: '0',
      borderTop: '30px solid transparent',
      borderBottom: '30px solid transparent',
      borderLeft: '20px solid #FF6685',
      cursor: 'pointer',
    }}
  />
)

export default Arrow
