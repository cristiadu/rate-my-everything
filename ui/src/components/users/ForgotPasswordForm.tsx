import React, { useState } from 'react'
import { requestPasswordReset } from '@/api/generated/api'

/** Props for the forgot password form; onBack returns to the login form. */
interface ForgotPasswordFormProps {
  onBack: () => void;
}

/** Asks for the account's email and has the API send it a link to choose a new password. */
const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await requestPasswordReset({ email })
      setIsSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the reset link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="box">
      <h2 className="title is-4">Forgot password</h2>
      {error && <div className="notification is-danger">{error}</div>}
      {isSent ? (
        <>
          <div className="notification is-success is-light">
            If an account uses {email}, a link to choose a new password is on its way. It works once, for one hour.
          </div>
          <button className="button is-light" type="button" onClick={onBack}>Back to login</button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="block has-text-grey">Enter your account&apos;s email and you&apos;ll get a link to choose a new password.</p>
          <div className="field">
            <label className="label">Email</label>
            <div className="control">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                Send reset link
              </button>
            </div>
            <div className="control">
              <button className="button is-light" type="button" onClick={onBack}>Cancel</button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default ForgotPasswordForm
