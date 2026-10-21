import { describe, it, expect, vi, beforeEach } from 'vitest'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import MailService from '@/services/MailService'
import { logger } from '@/helpers/Logger'

/** Mail settings of a site on alwaysdata, which needs no SMTP login. */
const ALWAYSDATA_SETTINGS = {
  host: 'smtp-ramyev.alwaysdata.net',
  port: 465,
  from: 'Rate My Everything <noreply@ramyev.alwaysdata.net>',
  appUrl: 'https://ramyev.alwaysdata.net',
}

describe('MailService', () => {
  const sendMail = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    sendMail.mockReset()
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail } as Partial<Transporter> as Transporter)
  })

  it('connects with TLS on port 465 and without a login when none is set', () => {
    // GIVEN the alwaysdata settings
    // WHEN the service is built
    new MailService(ALWAYSDATA_SETTINGS)

    // THEN the transport uses TLS from the start and no login
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp-ramyev.alwaysdata.net', port: 465, secure: true, auth: undefined,
    })
  })

  it('connects with STARTTLS and the login on port 587', () => {
    // GIVEN settings for port 587 with a login
    // WHEN the service is built
    new MailService({ ...ALWAYSDATA_SETTINGS, port: 587, user: 'noreply@ramyev.alwaysdata.net', password: 'mailbox-password' })

    // THEN the transport upgrades with STARTTLS and logs in
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp-ramyev.alwaysdata.net',
      port: 587,
      secure: false,
      auth: { user: 'noreply@ramyev.alwaysdata.net', pass: 'mailbox-password' },
    })
  })

  it('emails the user a link to the reset page with the token', async () => {
    // GIVEN a service with the alwaysdata settings
    const mailService = new MailService(ALWAYSDATA_SETTINGS)

    // WHEN ada's reset email is sent
    await mailService.sendPasswordReset('ada@example.com', 'ada', 'reset-token_123', 60)

    // THEN it goes to her from the sender, naming her and linking to the reset page with the token
    const [message] = sendMail.mock.calls[0]
    expect(message.from).toBe('Rate My Everything <noreply@ramyev.alwaysdata.net>')
    expect(message.to).toBe('ada@example.com')
    expect(message.subject).toBe('Reset your Rate My Everything password')
    expect(message.text).toContain('Hi ada,')
    expect(message.text).toContain('within 60 minutes')
    expect(message.text).toContain('https://ramyev.alwaysdata.net/reset-password?token=reset-token_123')
  })

  it('only logs a warning when SMTP is not configured', async () => {
    // GIVEN a service without mail settings
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    const mailService = new MailService(null)

    // WHEN a reset email is sent
    await mailService.sendPasswordReset('ada@example.com', 'ada', 'reset-token_123', 60)

    // THEN nothing is sent and the warning leaves out the token
    expect(sendMail).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('Password reset requested, but SMTP_HOST is not set, so no email was sent')
  })
})
