import React, { useState } from 'react'
import { Block } from 'react-bulma-components'
import { slide as SlideMenu } from 'react-burger-menu'

const FilterMenu = () => {
  const [isOpen, setIsOpen] = useState(false)

  const Arrow = () => (
    <div onClick={() => setIsOpen(!isOpen)} style={{
      position: 'absolute',
      top: '10px', // Adjust this value to position the arrow vertically
      right: '-20px', // Adjust this value to position the arrow horizontally
      width: '0',
      height: '0',
      borderTop: '30px solid transparent', // Adjust these values to change the size of the arrow
      borderBottom: '30px solid transparent',
      borderLeft: '20px solid #FF6685', // Change this color to adjust the color of the arrow
      cursor: 'pointer',
    }} />
  )

  const styles = {
    bmBurgerButton: {
      display: 'none',
    },
    bmCross: {
      background: '#373a47',
    },
  }

  return (
    <SlideMenu isOpen={isOpen} className="box has-background-danger-light" styles={styles}>
      <Block>
        <Arrow />
        Filters
      </Block>
    </SlideMenu>
  )
}

export default FilterMenu
