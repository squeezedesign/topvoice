---
name: email-sending-fails-silently
description: Gmail app-password trap on the Top Voice form, and why email debug logging is now a liability rather than a help
metadata:
  type: project
---

Production sends through Gmail SMTP (smtp.gmail.com:587, TLS) using an app
password. On 2026-09-23 it broke with `535-5.7.8 Username and Password not
accepted ... BadCredentials`.

**Cause, confirmed: Raquel had changed the Gmail account password the day
before.** Changing the account password revokes every app password at once,
and so does turning off 2-Step Verification — those are the only two things
that break it, it is not random. Fix: new 16-char app password from
https://myaccount.google.com/apppasswords (needs 2FA on), pasted **without
spaces** into admin -> Plugins -> Email -> SMTP password. Verify with
`php bin/plugin email test-email --to=...` before touching the form.

Raquel is fed up with this failure mode and open to moving off Gmail SMTP. The
plugin's built-in engines are sendmail / smtp / smtps / native, so a relay like
Brevo works by just changing server/user/password — but the `from:` must then
become a topvoicetgn.com address with the provider's SPF/DKIM records, because
sending as @gmail.com through a third party fails Gmail's DMARC.

**Email plugin 5.2.1 (2026-09-24) fixed the silence.** `email.php:211`
now writes `plugin-email: could not send the form email: <detail>` to
`grav.log` on every failed send, regardless of the plugin's own `debug`
setting. The three layers below applied to 5.x before that, and are kept
because the same shape shows up elsewhere.

**Turn the plugin's `debug` OFF.** It is no longer needed for diagnosis, and
it is actively dangerous: `Email::send()` writes its debug line *after* the
message has gone out (`classes/Email.php:345`), so if `logs/email.log` is not
writable the mail is delivered and *then* the request dies with an uncaught
Monolog exception — the visitor sees a failure for a message that actually
arrived. That happened on 2026-09-24 because `php bin/plugin email test-email`
had been run as root the day before, leaving `logs/email.log` owned by root.
See [[server-file-ownership]].

**The three layers of silence in 5.x, before 5.2.1:**

1. `Email.php:98` catches `TransportExceptionInterface` inside `send()`,
   returns 0 and writes nothing to `grav.log`. Only a *different* failure (an
   invalid message, e.g. an empty To header) escapes as an exception and gets
   logged there.
2. `email.php:174` turns that 0 into an `onFormValidationError` — a form
   error notice, still unlogged.
3. The detail goes to **`logs/email.log`**, not `grav.log` (`Email.php:378`
   builds its own `Logger('email')`), and only when `plugins.email.debug` is
   true.

So: `tail logs/email.log`, not grav.log. `php bin/plugin email test-email
--to=…` reproduces it without touching the form, but it only prints "Problem
sending email..." — the reason still comes from email.log.

A `grav.INFO: Form Captcha (cap) validation successful` line proves the
captcha and honeypot passed and the failure is downstream — see
[[contact-form-antispam]].

Until 2026-09-23 the theme's AJAX handler looked for `.notices.alert-danger`,
which the Form plugin never emits, so every one of these failures was shown to
visitors as "message sent successfully". Fixed in commit 3d9398a. Worth
remembering that the site may have been silently dropping messages for an
unknown period before that.
