# Password-reset email relay (Google Apps Script)

A free way to send CodePath Cloud's password-reset emails without a custom domain or paid email service.
The API calls this Apps Script web app over HTTPS (Render's free plan blocks SMTP), and the script sends
the email with `MailApp` from the Google account that deployed it.

## Limits (from Google's documentation)

- **100 recipients a day** for a gmail.com account (1,500 for Google Workspace). The quota resets 24 hours
  after the first send, and Google says quotas can change without notice. When it runs out, students still see
  the usual "check your inbox" message but get no email, and the API logs `daily email quota is used up`.
- Emails come **from the Gmail address** that deploys the script, with the display name "CodePath Cloud".
  A gmail.com account cannot send from a no-reply address. Use a dedicated Gmail account so your personal
  address is not shown to students.
- The script asks for one permission only: `script.send_mail` ("Send email as you").

## Security

- The web app must be public ("Anyone") so the API can reach it, so every request is signed with
  HMAC-SHA256 using a shared secret. Unsigned or wrongly signed requests are refused.
- Each request has a timestamp (accepted for 5 minutes) and a one-time nonce, so a captured request cannot be
  replayed. Nonces are remembered in the script cache for 15 minutes.
- The script writes the email itself. Callers send only the recipient, name and reset link, and the link must
  start with `APP_URL/reset-password#token=`. Someone holding the secret still cannot send other content.
- Nothing from a request is logged, and errors are short codes.

## Setup

1. Sign in to the Gmail account that should send the emails (a dedicated one is best).
2. Generate a secret **on your own computer** (never paste it into chat or commit it):
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
3. Open <https://script.google.com>, choose **New project** and name it "CodePath Cloud mail relay".
4. In **Project Settings**, tick **Show "appsscript.json" manifest file in editor**.
5. In the editor, replace the contents of `Code.gs` and `appsscript.json` with the files in this folder.
6. In **Project Settings > Script Properties**, add:
   - `SHARED_SECRET`: the secret from step 2
   - `APP_URL`: `https://code-path-cloud.vercel.app` (no trailing slash)
7. Choose **Deploy > New deployment**, type **Web app**, **Execute as: Me**, **Who has access: Anyone**, then **Deploy**.
8. Choose **Authorize access**. Because the script is yours and unverified, Google shows "Google hasn't verified
   this app": choose **Advanced > Go to CodePath Cloud mail relay (unsafe)**. Check that the only permission
   listed is **Send email as you**; if anything else is listed, stop. Students never see this screen.
9. Copy the **Web app URL** (it ends in `/exec`).
10. On Render, set `MAIL_APPS_SCRIPT_URL` to that URL and `MAIL_APPS_SCRIPT_SECRET` to the same secret.
    Remove `RESEND_API_KEY` and `BREVO_API_KEY` if they are set. Keep `APP_URL`.
11. After Render restarts, its log should show `[mail] mode=apps-script` with no `[mail] WARNING` lines.
    Then send a test email from the **System** page as an admin.

To change the script later, edit it, then use **Deploy > Manage deployments > Edit > Version: New version**
so the URL stays the same. To rotate the secret, change it in Script Properties and on Render together.
