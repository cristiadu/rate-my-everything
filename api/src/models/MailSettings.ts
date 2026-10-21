/** How the API sends email, read from the SMTP_* and APP_URL environment variables. */
export interface MailSettings {
  /** SMTP server, e.g. smtp-ramyev.alwaysdata.net. */
  host: string
  /** SMTP port: 465 for TLS from the start, 587 for STARTTLS. */
  port: number
  /** SMTP login; left out when the server needs none, like alwaysdata's own for sites it hosts. */
  user?: string
  /** Password of the SMTP login. */
  password?: string
  /** Sender address of every email, e.g. "Rate My Everything <noreply@ramyev.alwaysdata.net>". */
  from: string
  /** Public address of the app that links in emails open, e.g. https://ramyev.alwaysdata.net. */
  appUrl: string
}
