import React from 'react'
import { StoryFn, Meta } from '@storybook/react-webpack5'
import { Button } from 'react-bulma-components'

export default {
  title: 'Bulma/Button',
  component: Button,
} as Meta

export type ButtonStoryOptions = {
  props: object
  text: string
}

const Template: StoryFn<ButtonStoryOptions> = ({ props, text }) => <Button {...props}>{ text }</Button>

export const Primary = Template.bind({})
Primary.args = {
  props: {
    color: 'primary',
  },
  text: 'My Button',
}

export const Secondary = Template.bind({})
Secondary.args = {
  props: {
    color: 'dark',
  },
  text: 'My Secondary Button',
}

export const Large = Template.bind({})
Large.args = {
  props: {
    color: 'primary',
    size: 'large',
  },
  text: 'My Large Button',
}

export const Small = Template.bind({})
Small.args = {
  props: {
    color: 'primary',
    size: 'small',
  },
  text: 'My Small Button',
}
