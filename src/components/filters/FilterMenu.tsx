import React from 'react'
import { Block } from 'react-bulma-components'
import { slide as SlideMenu } from 'react-burger-menu'

const styles = {
  bmBurgerButton: {
    position: 'absolute',
    width: '25px',
    height: '18px',
    left: '16px',
    top: '16px',
  },
  bmBurgerBars: {
    background: '#373a47',
  },
  bmBurgerBarsHover: {
    background: '#a90000',
  },
  bmCrossButton: {
    height: '744px',
    width: '744px',
  },
  bmCross: {
    background: '#373a47',
  },
}

export default () => (
  <SlideMenu className="box has-background-danger-light" styles={styles} noOverlay>
    <Block>
      Filters
    </Block>
  </SlideMenu>
)
