import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Form, Button,
  Message,
} from 'react-bulma-components'
import {
  UserRole, createUser, login as signIn, register, updateUser, type UserInput, type UserResponse,
} from '@/api/generated/api'
import { useAuth } from '@/components/users/AuthContext'
import { MIN_PASSWORD_LENGTH, type StatusMessage } from '@/components/types'

/**
 * Props for the user form; pass a user to edit it, or none to create one.
 * Without onSubmit the form saves through the API itself; with onSubmit the parent saves the values.
 * With isSignUp a visitor creates their own account: no roles to pick, and they are signed in and sent home afterwards.
 */
interface CreateUserFormProps {
  user?: UserResponse;
  isSignUp?: boolean;
  isSaving?: boolean;
  onSubmit?: (values: UserInput) => void;
  onCancel?: () => void;
}

/** Form that creates a user, or edits one when a user is passed in. */
const CreateUserForm: React.FC<CreateUserFormProps> = ({
  user, isSignUp = false, isSaving: isParentSaving = false, onSubmit, onCancel,
}) => {
  const isEditing = !!user
  const { isAuthenticated, login } = useAuth()
  const [formFields, setFormFields] = useState<UserInput>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    roles: user?.roles ?? [UserRole.USER],
  })
  const [repeatedPassword, setRepeatedPassword] = useState('')
  const [submitStatus, setSubmitStatus] = useState<StatusMessage>(null)
  const [isSaving, setIsSaving] = useState(false)

  /** Copies a text input's value into the form state by its name. */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormFields({
      ...formFields,
      [e.target.name]: e.target.value,
    })
  }

  /** Adds the role if it is missing, or removes it if present. */
  const handleRoleChange = (role: UserRole) => {
    setFormFields({
      ...formFields,
      roles: formFields.roles.includes(role)
        ? formFields.roles.filter((current) => current !== role)
        : [...formFields.roles, role],
    })
  }

  /** Hands the values to the parent when it saves them, otherwise creates or updates the user and reports the outcome. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((formFields.password ?? '') !== repeatedPassword) {
      setSubmitStatus({ message: 'Passwords do not match', isSuccess: false })
      return
    }
    if (onSubmit) {
      onSubmit(formFields)
      return
    }

    setIsSaving(true)
    setSubmitStatus(null)

    // Only send a password when one was typed, so editing keeps the current one
    const { password, ...rest } = formFields
    const body: UserInput = password ? formFields : rest

    try {
      if (isSignUp) {
        // The API gives every new account the user role; admins grant the others
        const credentials = { username: formFields.username, password: password ?? '' }
        await register({ ...credentials, email: formFields.email })
        const { token } = await signIn(credentials)
        login(token)
        return
      }
      if (isEditing) {
        await updateUser(user.id, body)
      } else {
        await createUser(body)
      }
      setSubmitStatus({
        message: isEditing ? 'User updated successfully!' : 'User created successfully!',
        isSuccess: true,
      })
    } catch (err) {
      setSubmitStatus({
        message: err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} ${isSignUp ? 'account' : 'user'}`,
        isSuccess: false,
      })
    } finally {
      setIsSaving(false)
    }
  }

  /** Text on the submit button for the form's mode. */
  let submitLabel = 'Create User'
  if (isEditing) submitLabel = 'Save changes'
  else if (isSignUp) submitLabel = 'Create Account'

  if (isSignUp && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit user' : 'Create user'}>
      {submitStatus && (
        <Message color={submitStatus.isSuccess ? 'success' : 'danger'}>
          <Message.Body>
            {submitStatus.message}
          </Message.Body>
        </Message>
      )}
      <Form.Field>
        <Form.Label renderAs="label" htmlFor="user-username">Username</Form.Label>
        <Form.Control>
          <Form.Input
            renderAs="input"
            id="user-username"
            type="text"
            placeholder="Enter the username"
            value={formFields.username}
            onChange={handleInputChange}
            required
            name="username"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label renderAs="label" htmlFor="user-email">Email</Form.Label>
        <Form.Control>
          <Form.Input
            renderAs="input"
            id="user-email"
            type="email"
            placeholder="Enter the email"
            value={formFields.email}
            onChange={handleInputChange}
            required
            name="email"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label renderAs="label" htmlFor="user-password">
          {isEditing ? 'New password (leave blank to keep the current one)' : 'Password'}
        </Form.Label>
        <Form.Control>
          <Form.Input
            renderAs="input"
            id="user-password"
            type="password"
            placeholder="Enter the password"
            value={formFields.password}
            onChange={handleInputChange}
            required={!isEditing}
            minLength={MIN_PASSWORD_LENGTH}
            name="password"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field>
        <Form.Label renderAs="label" htmlFor="user-repeat-password">
          {isEditing ? 'Repeat new password' : 'Repeat password'}
        </Form.Label>
        <Form.Control>
          <Form.Input
            renderAs="input"
            id="user-repeat-password"
            type="password"
            placeholder="Enter the password again"
            value={repeatedPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepeatedPassword(e.target.value)}
            required={!isEditing || !!formFields.password}
            name="repeatPassword"
          />
        </Form.Control>
      </Form.Field>

      {!isSignUp && (
        <Form.Field>
          <Form.Label renderAs="label">Roles</Form.Label>
          <Form.Control>
            {Object.values(UserRole).map((role) => (
              <Form.Checkbox
                key={role}
                renderAs="input"
                className="mr-4"
                checked={formFields.roles.includes(role)}
                onChange={() => handleRoleChange(role)}
              >
                {role}
              </Form.Checkbox>
            ))}
          </Form.Control>
        </Form.Field>
      )}

      <Form.Field kind="group">
        <Form.Control>
          <Button renderAs="button" type="submit" color="primary" loading={isSaving || isParentSaving}>
            {submitLabel}
          </Button>
        </Form.Control>
        {onCancel && (
          <Form.Control>
            <Button renderAs="button" type="button" color="light" onClick={onCancel}>
              Cancel
            </Button>
          </Form.Control>
        )}
      </Form.Field>
    </form>
  )
}

export default CreateUserForm
