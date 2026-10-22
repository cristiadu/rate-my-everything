import { describe, it, expect } from 'vitest'
import { readMailSettings } from '@/helpers/MailHelper'

describe('readMailSettings', () => {
  it('turns email off when SMTP_HOST is not set', () => {
    // GIVEN an environment without SMTP_HOST
    // WHEN the mail settings are read
    // THEN there are none
    expect(readMailSettings({ SMTP_FROM: 'noreply@example.com' })).toBeNull()
  })

  it('reads the SMTP server, login, sender and app address', () => {
    // GIVEN every mail variable
    const env = {
      SMTP_HOST: 'smtp-ramyev.alwaysdata.net',
      SMTP_PORT: '587',
      SMTP_USER: 'noreply@ramyev.alwaysdata.net',
      SMTP_PASSWORD: 'mailbox-password',
      SMTP_FROM: 'Rate My Everything <noreply@ramyev.alwaysdata.net>',
      APP_URL: 'https://ramyev.alwaysdata.net',
    }

    // WHEN the mail settings are read
    // THEN they carry those values, with the port as a number
    expect(readMailSettings(env)).toEqual({
      host: 'smtp-ramyev.alwaysdata.net',
      port: 587,
      user: 'noreply@ramyev.alwaysdata.net',
      password: 'mailbox-password',
      from: 'Rate My Everything <noreply@ramyev.alwaysdata.net>',
      appUrl: 'https://ramyev.alwaysdata.net',
    })
  })

  it('names every missing variable once SMTP_HOST is set', () => {
    // GIVEN only the SMTP server and port
    const env = { SMTP_HOST: 'smtp-ramyev.alwaysdata.net', SMTP_PORT: '465' }

    // WHEN the mail settings are read
    // THEN it fails naming the sender and app address variables
    expect(() => readMailSettings(env)).toThrow('SMTP_HOST is set but SMTP_FROM, APP_URL is not set')
  })
})
