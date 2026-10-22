import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { MailSettings } from '@/models/MailSettings'
import { readMailSettings } from '@/helpers/MailHelper'
import { logger } from '@/helpers/Logger'

/** SMTP port that speaks TLS from the first byte; other ports upgrade with STARTTLS. */
const IMPLICIT_TLS_PORT = 465

/** UI page the password reset link opens. */
const RESET_PASSWORD_PATH = '/reset-password'

/** Sends the API's emails over SMTP, or only logs that it would have when SMTP is not configured. */
export default class MailService {
  private transporter: Transporter | null

  private settings: MailSettings | null

  constructor(settings: MailSettings | null) {
    this.settings = settings
    this.transporter = settings && nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === IMPLICIT_TLS_PORT,
      auth: settings.user ? { user: settings.user, pass: settings.password } : undefined,
    })
  }

  /** Emails a user the link that lets them choose a new password, valid for the given number of minutes. */
  async sendPasswordReset(to: string, username: string, token: string, validMinutes: number): Promise<void> {
    if (!this.transporter || !this.settings) {
      logger.warn('Password reset requested, but SMTP_HOST is not set, so no email was sent')
      return
    }

    const link = new URL(RESET_PASSWORD_PATH, this.settings.appUrl)
    link.searchParams.set('token', token)
    await this.transporter.sendMail({
      from: this.settings.from,
      to,
      subject: 'Reset your Rate My Everything password',
      text: [
        `Hi ${username},`,
        '',
        'Someone asked to reset the password of your Rate My Everything account.',
        `Open this link within ${validMinutes} minutes to choose a new one:`,
        '',
        link.toString(),
        '',
        'If it was not you, ignore this email and your password stays the same.',
      ].join('\n'),
    })
  }
}

/** The mail service every request shares, built once from the environment so a wrong SMTP setup stops the API on start. */
export const mailService = new MailService(readMailSettings(process.env))
