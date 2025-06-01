import React, { useState } from 'react'
import {
  Form, Button,
  Message,
} from 'react-bulma-components'
import ApiConfig from '../../config/ApiConfig'

const CreateUserForm: React.FC = () => {
  const [formFields, setFormFields] = useState({ name: '', email: '', password: '' })
  const [submitStatus, setSubmitStatus] = useState<{message: string, isSuccess: boolean} | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormFields({
      ...formFields,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Call your API here to create the user
    try {
      const response = await fetch(ApiConfig.API_URL + ApiConfig.ENDPOINTS.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formFields),
      })

      if (response.ok) {
        // User created successfully
        setSubmitStatus({ message: 'User created successfully!', isSuccess: true })
      } else {
        // Handle error response
        setSubmitStatus({ message: 'Failed to create user', isSuccess: false })
      }
    } catch {
      setSubmitStatus({ message: 'Network error', isSuccess: false })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {submitStatus && (
        <Message color={submitStatus.isSuccess ? 'success' : 'danger'}>
          <Message.Body>
            {submitStatus.message}
          </Message.Body>
        </Message>
      )}
      <Form.Field>
        <Form.Label>Name</Form.Label>
        <Form.Control>
          <Form.Input
            type="text"
            placeholder="Enter your name"
            value={formFields.name}
            onChange={handleInputChange}
            required
            name="name"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label>Email</Form.Label>
        <Form.Control>
          <Form.Input
            type="email"
            placeholder="Enter your email"
            value={formFields.email}
            onChange={handleInputChange}
            required
            name="email"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label>Password</Form.Label>
        <Form.Control>
          <Form.Input
            type="password"
            placeholder="Enter your password"
            value={formFields.password}
            onChange={handleInputChange}
            required
            name="password"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Control>
          <Button type="submit" color="primary">
            Create User
          </Button>
        </Form.Control>
      </Form.Field>
    </form>
  )
}

export default CreateUserForm
