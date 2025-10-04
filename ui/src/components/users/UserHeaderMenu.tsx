import React, { useState } from 'react'
import {
  Heading, Level, Form, Button,
} from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import ApiConfig from '@/config/ApiConfig'

const UserHeaderMenu = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { isAuthenticated, login, logout } = useAuth()

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${ApiConfig.API_URL}${ApiConfig.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials')
      }

      login(data.token)
      // Reset form
      setUsername('')
      setPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Level p={2} backgroundColor="dark" textColor="primary">
      <Level.Side pr={2} align="left">
        <Level.Item>
          <Heading
            size={6}
            subtitle
          >
            {isAuthenticated ? 'Welcome!' : 'User Section'}
          </Heading>
        </Level.Item>
      </Level.Side>

      {!isAuthenticated ? (
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
                    <Form.Input
                      placeholder="Username"
                      size="small"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    />
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
                    <Form.Input
                      placeholder="Password"
                      type="password"
                      size="small"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                  </Form.Control>
                </Form.Field>
              </Form.Field.Body>
            </Form.Field>
          </Level.Item>
          <Level.Item>
            <Button
              size="small"
              color="danger"
              mr={2}
              onClick={handleLogin}
              loading={isLoading}
            >
              Log In
            </Button>
            <Button size="small" color="info">New Account</Button>
          </Level.Item>
          {error && (
            <Level.Item>
              <div className="has-text-danger is-size-7">{error}</div>
            </Level.Item>
          )}
        </Level.Side>
      ) : (
        <Level.Side align="right">
          <Level.Item>
            <Button size="small" color="danger" onClick={logout}>Log Out</Button>
          </Level.Item>
        </Level.Side>
      )}
    </Level>
  )
}

export default UserHeaderMenu
