import React, { useState } from 'react'
import {
  type AdminUser, MIN_PASSWORD_LENGTH, type UserFormValues, UserRole,
} from '@/components/types'

/** Props for the admin user form; pass a user to edit it, or none to create one. */
interface UserFormProps {
  user?: AdminUser;
  isSaving: boolean;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

/** Form for creating or editing a user's details, password and roles. */
const UserForm: React.FC<UserFormProps> = ({
  user, isSaving, onSubmit, onCancel,
}) => {
  const isEditing = !!user
  const [values, setValues] = useState<UserFormValues>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    roles: user?.roles ?? [UserRole.USER],
  })

  /** Copies a text input's value into the form state by its name. */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
  }

  /** Adds the role if it is missing, or removes it if present. */
  const toggleRole = (role: UserRole) => {
    setValues({
      ...values,
      roles: values.roles.includes(role)
        ? values.roles.filter((current) => current !== role)
        : [...values.roles, role],
    })
  }

  /** Hands the form values to the parent instead of submitting the page. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit user' : 'Create user'}>
      <div className="field">
        <label className="label" htmlFor="user-username">Username</label>
        <div className="control">
          <input
            className="input"
            id="user-username"
            name="username"
            value={values.username}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="user-email">Email</label>
        <div className="control">
          <input
            className="input"
            id="user-email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="user-password">
          {isEditing ? 'New password (leave blank to keep the current one)' : 'Password'}
        </label>
        <div className="control">
          <input
            className="input"
            id="user-password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleInputChange}
            required={!isEditing}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>
      </div>

      <fieldset className="field">
        <legend className="label">Roles</legend>
        <div className="control">
          {Object.values(UserRole).map((role) => (
            <label key={role} className="checkbox mr-4">
              <input
                type="checkbox"
                checked={values.roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {' '}{role}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field is-grouped">
        <div className="control">
          <button className={`button is-primary ${isSaving ? 'is-loading' : ''}`} type="submit" disabled={isSaving}>
            {isEditing ? 'Save changes' : 'Create user'}
          </button>
        </div>
        <div className="control">
          <button className="button is-light" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </form>
  )
}

export default UserForm
