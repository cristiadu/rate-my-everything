import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/api/generated/api'

/** Props for the reset password form; onSuccess runs once the password is changed and onCancel returns to the login form. */
interface ResetPasswordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/** Sets a new password with the token from the emailed reset link's `token` query parameter. */
const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess, onCancel }) => {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await resetPassword({ token: searchParams.get('token') ?? '', password })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while changing the password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="box">
      <h2 className="title is-4">Choose a new password</h2>
      {error && <div className="notification is-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">New password</label>
          <div className="control">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Confirm new password</label>
          <div className="control">
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="field is-grouped">
          <div className="control">
            <button
              className={`button is-primary ${isLoading ? 'is-loading' : ''}`}
              type="submit"
              disabled={isLoading}
            >
              Save password
            </button>
          </div>
          <div className="control">
            <button className="button is-light" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ResetPasswordForm
