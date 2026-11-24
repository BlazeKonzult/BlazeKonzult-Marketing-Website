# Deploying BlazeKonzult to GoDaddy cPanel

These steps take the live site at https://blazekonzult.nl from the old static files to the full Node.js application: website, admin (Command Centre), assessments and API in one app.

You need:
- `blazekonzult-app.zip`, the ready-built application.
- `PRODUCTION-SECRETS.txt`, your private keys and settings.

Both are in your project's `Claude outputs` folder.

Allow about 30–45 minutes. The site is briefly unavailable between steps 3 and 6.

---

## 1. Back up the current site

1. In cPanel, open **File Manager**, then **public_html**.
2. Turn on **Settings → Show Hidden Files**.
3. **Select All**, then **Compress** to make a Zip Archive named `old-static-site.zip`.
4. Download the zip to your computer.

## 2. Create the database

1. In cPanel, open **Database Wizard**, under Databases.
2. Database name: `blazekonzult`. cPanel adds a prefix, for example `abcd1234_blazekonzult`. **Write down the full name.**
3. Database user: `bkapp`, with a strong generated password. **Write down the full user name and the password.**
4. Privileges: tick **ALL PRIVILEGES**, then **Next Step**.

## 3. Upload the application and clear public_html

1. In File Manager, open your **home folder** (the top level, `/home/<your-cpanel-user>`). Do not use public_html.
2. **Upload** `blazekonzult-app.zip`, then select it and click **Extract**. This creates the folder `blazekonzult`.
3. In your home folder, create a folder called `old-static-site`.
4. Open **public_html** (with hidden files shown), **Select All**, then **Move** everything to `/home/<your-cpanel-user>/old-static-site`.
   - This includes the old `.htaccess`. It must not stay in public_html, because it would send visitors to the old static pages.
   - public_html should now be empty. cPanel puts its own small `.htaccess` there in the next step.

## 4. Create the Node.js application

In cPanel, open **Setup Node.js App** (under Software), then **Create Application**:

| Field | Value |
|---|---|
| Node.js version | **20.x or newer** (choose the highest offered; at least 20.9) |
| Application mode | **Production** |
| Application root | `blazekonzult` |
| Application URL | `blazekonzult.nl`, with the path left empty |
| Application startup file | `server.js` |

Under **Environment variables**, click **Add Variable** for each line in `PRODUCTION-SECRETS.txt`:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SITE_URL` | `https://blazekonzult.nl` |
| `DB_HOST` | `localhost` |
| `DB_NAME` | your full database name from step 2 |
| `DB_USER` | your full database user from step 2 |
| `DB_PASS` | the database password |
| `APP_KEY`, `INDEX_KEY`, `CRON_KEY` | copied exactly from the secrets file |
| `MAIL_FROM` | `no-reply@blazekonzult.nl` |
| `BK_EMAIL`, `BK_NAME`, `BK_PASSWORD` | your admin sign-in (first setup only) |

Click **Create**.

## 5. Install and set up

On the application's page:
1. Click **Run NPM Install** and wait for it to finish. This takes 1–3 minutes.
2. Under **Run JS script**, choose **setup** and click **Run**. The output should say:
   - "Database tables: ready"
   - "Starter assessments: …"
   - "Owner account created for …"
3. **Delete the `BK_PASSWORD` variable**, click **Save**, then click **Restart**.

## 6. Check the site

1. Open https://blazekonzult.nl. The homepage should load.
2. Also check https://blazekonzult.nl/nl/ and https://blazekonzult.nl/cybersecurity-assessment/.
3. Open https://blazekonzult.nl/admin/ and sign in with BK_EMAIL and the password you chose. You will be asked to set up two-factor sign-in: scan the QR code with your authenticator app and save the 10 backup codes.

## 7. HTTPS

In cPanel, open **Domains**. Make sure **Force HTTPS Redirect** is **on** for blazekonzult.nl. SSL is usually already active through cPanel's AutoSSL.

## 8. Scheduled tasks (cron)

In cPanel, open **Cron Jobs** and add the two commands at the bottom of `PRODUCTION-SECRETS.txt`:

| When | What it does |
|---|---|
| Every 15 minutes (`*/15 * * * *`) | Sends and retries queued emails |
| Once a day, e.g. `15 3 * * *` | Runs data retention (deletes records past their retention period) |

## 9. Email

The app sends mail through the server's own `sendmail`. To check it:
1. In the admin, go to **Administration → Email delivery**.
2. Click **Send test** to your own address.

If the test fails, GoDaddy may require SMTP instead. Add these variables and restart:

| Variable | Value |
|---|---|
| `MAIL_DRIVER` | `smtp` |
| `SMTP_HOST` | your mail server, e.g. the cPanel mail server for blazekonzult.nl |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | a mailbox, e.g. `no-reply@blazekonzult.nl` |
| `SMTP_PASS` | that mailbox's password |

## 10. After launch

Work through **Security centre** in the admin:
- add a second owner account;
- confirm that retention has run (after the first daily cron).

---

## Updating later

1. Upload the new `blazekonzult-app.zip` to your home folder and **Extract** it, overwriting existing files.
2. Click **Run NPM Install**, but only if you were told the dependencies changed.
3. Click **Restart**. Database changes are applied automatically when the app starts.

## If something goes wrong

- **"Incomplete response" or a 503 error.** Open `blazekonzult/stderr.log` in File Manager to see the error. Then check that:
  - the Node version is 20.9 or newer;
  - the DB_ values match exactly, including the cPanel prefix;
  - NPM Install finished.
- **The old site still shows.** A leftover `.htaccess` or `index.html` is still in public_html. Move it to `old-static-site`.
- **Go back to the old site.** In Setup Node.js App, **Stop** the app, then move the files from `old-static-site` back into public_html.
- **Locked out of the admin.** If you lose your phone and backup codes, open the app's terminal. On the Node.js app page, copy the "Enter to the virtual environment" command into cPanel → Terminal, then run:

  ```
  node backend/dist/cli.js reset-2fa --email you@example.com
  ```

## What's in the package

The package holds the pre-built website (`.next`), the compiled API (`backend/dist`), public assets, `server.js` and `package.json` (runtime dependencies only).

It was tested from a clean install with `npm install --omit=dev` and a new empty database:
- setup created the tables, starter assessments and owner;
- the homepage, Dutch homepage, admin, services, assessment, API, sitemap and favicon all returned 200;
- unknown pages returned 404;
- the cron endpoint worked with the right key and refused a wrong one.

Uploaded images are stored in `/home/<your-cpanel-user>/bk-media`, outside the app folder, so updates never delete them.
