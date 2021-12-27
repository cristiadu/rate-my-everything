import React from 'react'
import {
  Heading, Level, Form, Icon,
} from 'react-bulma-components'

export default () => (
  <Level p={3}>
    <Level.Side>
      <Level.Item>
        <Heading
          size={5}
          subtitle
        >
          User Section
        </Heading>
      </Level.Item>
    </Level.Side>
    <Level.Side align="right">
      <Level.Item>
        <Form.Field>
          <Form.Label size="small">
            Username
          </Form.Label>
          <Form.Control>
            <Icon align="left">
              <i className="fas fa-user" />
            </Icon>
            <Form.Input placeholder="Username or email" size="small" />
          </Form.Control>
        </Form.Field>
      </Level.Item>
      <Level.Item>
        <Form.Field>
          <Form.Label size="small">
            Password
          </Form.Label>
          <Form.Control>
            <Icon align="left">
              <i className="fas fa-user" />
            </Icon>
            <Form.Input placeholder="Password" size="small" />
          </Form.Control>
        </Form.Field>
      </Level.Item>
    </Level.Side>
  </Level>
)
