import React from 'react'
import {
  Heading, Level, Form, Button,
} from 'react-bulma-components'

export default () => (
  <Level p={2} backgroundColor="dark" textColor="primary">
    <Level.Side pr={2} align="left">
      <Level.Item>
        <Heading
          size={6}
          subtitle
        >
          User Section
        </Heading>
      </Level.Item>
    </Level.Side>
    <Level.Side align="right">
      <Level.Item>
        <Form.Field horizontal>
          <Form.Field.Label className="is-align-items-center is-flex">
            <Form.Label size="small" textColor="danger">
              Username
            </Form.Label>
          </Form.Field.Label>
          <Form.Field.Body>
            <Form.Field>
              <Form.Control>
                <Form.Input placeholder="Username or email" size="small" />
              </Form.Control>
            </Form.Field>
          </Form.Field.Body>
        </Form.Field>
      </Level.Item>
      <Level.Item>
        <Form.Field horizontal>
          <Form.Field.Label className="is-align-items-center is-flex">
            <Form.Label size="small" textColor="danger">
              Password
            </Form.Label>
          </Form.Field.Label>
          <Form.Field.Body>
            <Form.Field>
              <Form.Control>
                <Form.Input placeholder="Password" size="small" />
              </Form.Control>
            </Form.Field>
          </Form.Field.Body>
        </Form.Field>
      </Level.Item>
      <Level.Item>
        <Button size="small" color="danger" mr={2}>Log In</Button>
        <Button size="small" color="info">New Account</Button>
      </Level.Item>
    </Level.Side>
  </Level>
)
