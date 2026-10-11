import React, { useEffect, useRef, useState } from 'react'
import type { SelectOption } from '@/components/types'

/** Props for a Bulma dropdown that lets the user tick several options. */
interface MultiSelectDropdownProps {
  id: string;
  label: string;
  options: SelectOption[];
  selected: number[];
  placeholder?: string;
  onChange: (selected: number[]) => void;
}

/** Dropdown button listing options as checkboxes; the button shows the chosen options as tags. */
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id, label, options, selected, placeholder = 'Select...', onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return undefined

    /** Closes the menu when the user clicks anywhere outside it. */
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [isOpen])

  /** Adds the option if it is not selected yet, or removes it. */
  const toggleOption = (value: number) => {
    onChange(selected.includes(value) ? selected.filter((current) => current !== value) : [...selected, value])
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value))

  return (
    <div ref={containerRef} className={`dropdown is-block ${isOpen ? 'is-active' : ''}`}>
      <div className="dropdown-trigger">
        <button
          id={id}
          className="button is-fullwidth is-justify-content-space-between"
          type="button"
          aria-label={label}
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="tags mb-0">
            {selectedOptions.length === 0 ? <span className="has-text-grey">{placeholder}</span> : selectedOptions.map((option) => (
              <span key={option.value} className="tag is-info mb-0">{option.label}</span>
            ))}
          </span>
          <span className="icon is-small" aria-hidden="true">▾</span>
        </button>
      </div>
      <div className="dropdown-menu is-fullwidth" style={{ width: '100%' }}>
        <div className="dropdown-content" role="group" aria-label={`${label} options`}>
          {options.map((option) => (
            <label key={option.value} className="dropdown-item checkbox is-block">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggleOption(option.value)}
              />
              {` ${option.label}`}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MultiSelectDropdown
