# Gindi Innovations — Homepage

A static, dependency-free homepage. Open `index.html` through any web server
(for example `python3 -m http.server`) or upload the folder to any static host
(Netlify, Vercel, GitHub Pages, cPanel, etc.).

```
index.html              Page structure
assets/js/config.js     ← Services, projects, contact details, form destination
assets/js/main.js       Behaviour (menus, service panels, lightbox, form)
assets/css/styles.css   Styles — colours and fonts are at the top in :root
assets/img/             Hero, project and favicon images
tools/wire-calculator.html  Wire calculator (Arabic, self-contained page)
tools/brick-calculator.html Brick calculator (Arabic, self-contained page)
tools/paint-calculator.html Paint calculator (Arabic, self-contained page)
tools/plaster-calculator.html Plaster cement & sand calculator (Arabic, self-contained page)
tools/ceramic-calculator.html Ceramic & tile calculator (Arabic, self-contained page)
excel/                  Excel versions of the calculators (brick, ceramic, paint, plaster, wire)
excel/_build/           Python (openpyxl) scripts that generate those Excel files
app/                    Gindi Studio mobile app (installable web app, see below)
```

## Gindi Studio mobile app (`app/`)

A project-management app for finishing work: engineer custody, expense
approvals, budgets per work item, treasury, tasks and snags, and a client view
with a statement of account. Arabic first, with an English toggle.

It has two modes:

- **Live** — people sign in, and everything is shared through Supabase. The
  manager creates the company, sends a join code, and sets each person's role
  (technical office, site engineer, client) and projects. Site engineers'
  expenses reach the manager for approval in real time; clients see only their
  own project.
- **Demo** — sample data saved on the phone only, with a role switcher. This is
  what runs while `app/config.js` is empty, and anyone can open it from the
  sign-in screen.

It is an installable web app (PWA): open `https://<your-site>/app/` in Safari →
Share → **Add to Home Screen** (iPhone), or in Chrome → **Install** (Android).

```
app/index.html            Page, styles and install banner
app/app.js                App logic (screens, live data, demo data)
app/config.js             Supabase project URL and anon key (public values)
app/manifest.webmanifest  App name, colours and icons used when installing
app/sw.js                 Offline support — bump VERSION after editing app files
app/icons/                Home-screen icons
supabase/schema.sql       Database tables, security rules and actions
supabase/migrations/      Database changes added after the first setup (run in order)
supabase/test/            Local Postgres tests of the security rules
```

### Connecting Supabase

1. Create a Supabase project (free plan is fine).
2. Run `supabase/schema.sql` in the SQL editor. It is safe to re-run, but
   re-running **deletes all app data**.
   Then run each file in `supabase/migrations/` in order (these are safe to
   re-run and never delete data). Later database changes always come as new
   migration files.
3. In **Authentication → URL Configuration**, set the Site URL to the app's
   address (for example `https://<your-site>/app/`) and add it to Redirect URLs.
4. Put the project URL and the **anon** key in `app/config.js`. Never use the
   `service_role` key in the app.

Who can do what is enforced by the database itself (row-level security), not
by the app: site engineers can only submit pending expenses on their own
projects, only the manager can approve or touch the treasury, and clients only
see their project's payments and approved spending.

To re-run the security tests locally (needs PostgreSQL 16):
`psql -f supabase/test/stub.sql && psql -f supabase/schema.sql && psql -f supabase/test/tests.sql`
on an empty database, then `psql -f supabase/migrations/002_invites.sql && psql -f supabase/test/tests_invites.sql`.

## Editing content

Everything you are likely to change lives in **`assets/js/config.js`**.

- **Services** — edit `services`. Each has a `name`, a short `summary` (shown on the
  tile), `details` and three `deliverables` (shown in the panel), and an `icon`
  (`design`, `fitout`, `visualization`, `lighting`, `furniture`, `consultation`).
  The enquiry form's "Service required" list is built from the same entries.
- **Tools** — edit `tools`. Each one appears as a full-width card under the
  service tiles and links to its own page (for example the wire and brick calculators in
  `tools/`). Tools are not listed in the enquiry form.
- **Contact details** — fill in `contact`. Anything left empty or still in
  `[SQUARE BRACKETS]` is hidden from the page, including the WhatsApp button.
  The WhatsApp message is pre-filled with the selected service (and name and
  description, if typed).
- **Logo** — set `brand.logo` to an image path (e.g. `assets/img/logo.svg`) to
  replace the "GINDI INNOVATIONS" text wordmark.
- **Colours and fonts** — edit the variables at the top of `assets/css/styles.css`.

## Enquiry form

Set `enquiryForm.endpoint` to a URL that accepts a `POST` of form data and
returns a 2xx status — for example a [Formspree](https://formspree.io) form URL
(`https://formspree.io/f/xxxxxxx`), Basin, Getform, or your own server.

Fields sent: `name`, `phone`, `service`, `message`, plus `_subject` and a
`_gotcha` spam-trap field.

The form validates every field. A success message is shown **only** when the
endpoint confirms the enquiry was received. Until an endpoint is configured,
the form explains that online enquiries aren't connected yet and points
visitors to WhatsApp, phone or email if those are configured.

## Images

- **Hero** — referenced directly in `index.html` (`hero-800/1400/2000.webp`
  plus `hero-1400.jpg` fallback). Replace the files or update the paths.
- **Projects** — each entry in `config.js` points to an image base path; the
  page loads `<base>-600.webp`, `<base>-1000.webp` and `<base>-1800.webp`
  (the largest is used when a visitor enlarges an image).

The current hero and project photos are **inspiration placeholders** from
[Unsplash](https://unsplash.com) (free to use under the Unsplash License). They
are not Gindi Innovations work and are labelled as such on the page. When you
add real project photos, set `placeholder: false` on each project to remove the
"Inspiration image" labels.

| File | Unsplash photo ID |
| --- | --- |
| `hero-*` | `photo-1618221195710-dd6b41faaea6` |
| `project-1-*` | `photo-1600607687939-ce8a6c25118c` |
| `project-2-*` | `photo-1617104678098-de229db51175` |
| `project-3-*` | `photo-1617806118233-18e1de247200` |

## Accessibility notes

- Service tiles and project images are real buttons; panels and the image
  viewer use native `<dialog>` (focus is held inside, <kbd>Esc</kbd> closes, focus
  returns to the tile afterwards). Use <kbd>←</kbd>/<kbd>→</kbd> in the image viewer.
- Visible gold focus outlines, 44–48px minimum tap targets, and a skip link.
- Animations are turned off for visitors who prefer reduced motion.
