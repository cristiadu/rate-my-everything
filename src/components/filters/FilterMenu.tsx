import React, { useState } from 'react'
import { Block, Form, Button, Tag, Dropdown } from 'react-bulma-components'
import { slide as SlideMenu } from 'react-burger-menu'

const FilterMenu = () => {
  const [isOpen, setIsOpen] = useState(false)

  const Arrow = () => (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
      position: 'absolute',
      top: '10px', // Adjust this value to position the arrow vertically
      right: '-20px', // Adjust this value to position the arrow horizontally
      width: '0',
      height: '0',
      borderTop: '30px solid transparent', // Adjust these values to change the size of the arrow
      borderBottom: '30px solid transparent',
      borderLeft: '20px solid #FF6685', // Change this color to adjust the color of the arrow
      cursor: 'pointer',
    }}
    />
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
        <Tag color="danger" size="large">FILTERS</Tag>
        <Form.Field style={{ marginTop: '20px' }}>
          <Form.Label color="dark" size="medium">Title</Form.Label>
          <Form.Control>
            <Form.Input placeholder="Search by title" />
          </Form.Control>
        </Form.Field>
        <Form.Field>
          <Form.Label color="dark" size="medium">Genre</Form.Label>
          <Dropdown>
            <Dropdown.Item value="Action">Action</Dropdown.Item>
            <Dropdown.Item value="Comedy">Comedy</Dropdown.Item>
            <Dropdown.Item value="Drama">Drama</Dropdown.Item>
            <Dropdown.Item value="Horror">Horror</Dropdown.Item>
          </Dropdown>
        </Form.Field>
        <Form.Field>
          <Form.Label color="dark" size="medium">Year</Form.Label>
          <Form.Control>
            <Form.Input type="number" placeholder="Search by year" />
          </Form.Control>
        </Form.Field>
        <Form.Field>
          <Form.Label color="dark" size="medium">Rating</Form.Label>
          <Form.Control>
            <Form.Input type="number" min="0" max="10" placeholder="Search by rating" />
          </Form.Control>
        </Form.Field>
        <Button color="dark">Submit</Button>
      </Block>
    </SlideMenu>
  )
}

export default FilterMenu
