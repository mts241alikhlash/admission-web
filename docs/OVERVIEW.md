# admission-web

PPDB, as a browser sees it: an applicant registers, fills a form, uploads
documents, pays, and waits for a decision; an administrator opens waves,
verifies documents, and accepts or rejects. Vue 3 + Vite, same stack as
`academic-web`.

## What changed structurally

`apps/admission` depended on `@mts241alikhlash/platform`, `@mts241alikhlash/shared` and `@mts241alikhlash/ui` as
`workspace:*` pnpm packages, real inside the monorepo's `pnpm-workspace.yaml`,
nothing outside it.

Every actual import in the source already went through a path alias:
`@/shared/*`, `@/ui/*`, `@/features/platform/*`, resolved in `vite.config.ts`
and `tsconfig`, never the bare package name. So the packages' `src/` folders
were copied in under `packages/*/src/`, and the alias targets moved from
`../../packages/*` to `./packages/*`. **Not one import statement in any `.ts`
or `.vue` file needed to change.**

`packages/*` here are not real packages: no `package.json` of their own, their
dependencies merged into this app's single one. Same shape as `academic-web`,
and the same shape as a backend's `platform/` folder.

## What was narrowed

`packages/platform` carried eighteen feature folders. This app imports four:
`auth`, `profile`, `reference-data`, `settings`, which pull in three more
(`address`, `blood-type`, `religion`). The other eleven belonged to screens
this app does not have, and went:

    achievement-type  audit-log  dashboard  file  organization  permission
    role  school-unit  school-unit-type  tenant  user-role

`packages/reference-data` went whole: nothing under `src/` referenced it. That
took `religion` and `blood-type` down to their `api/`, `services/` and
`types/` with it: their `config.ts`, `routes.ts` and `*ListView.vue` were the
reference-data-driven admin screens, and this app's router registers neither. Only
`religionApi` and `bloodTypeApi` are reached, from the two profile forms.

## Which services answer it

One origin, four services behind it: `api-routes.config.ts` is the manifest,
and it is read by `vite.config.ts` for the dev proxy and by
`infra/nginx/generate.mjs` at the workspace root for the gateway.

| Service | Port | Answers |
|---|---|---|
| identity | 3000 | `/auth`, `/users`, `/profiles`, `/religions`, `/blood-types` |
| academic | 3200 | `/academic-years` |
| admission | 3700 | `/admissions` |

**All three must be running.** `/academic-years` is there because an admission
wave belongs to an academic year and admission-service stopped declaring
`academic_years` on 2026-09-09. It holds the id and reads the name over HTTP,
so the browser has to pick from the same list the backend resolves against.

## The one gap, and why it is a 404 rather than a deletion

`/settings`, `platform/settings`'s `AppSetting`: logo, title, favicon,
maintenance-mode toggle, per-menu-item visibility. **No service in this
platform serves it.** It was an admin screen that did not
survive the split.

`academic-web` dealt with this by deleting the feature and falling back to
static defaults. This extraction was asked to change no UI, so the feature
stays, the calls stay typed and correct, and `/settings` is listed in
`UNROUTED_PREFIXES`, which makes the dev server refuse it with a 404 exactly
as the gateway does, instead of Vite's SPA fallback answering `index.html` at
HTTP 200 and leaving `res.data.data` undefined.

Closing it means deciding which service owns application settings. That is a
question the platform has not answered, and inventing an answer here would put
the same table in two places again.

## When a service is not running

Every read that used to end `catch { return [] }` now calls `notifyIfOutage`
first (`@/shared/utils/notify-outage`). An empty list and an unreachable
service look identical on screen, and only one of them is a fact about the
school. An applicant told "belum ada gelombang dibuka" when admission-service
is down will go away and not come back.

`ServiceUnavailable` (`@/ui`) is the in-page version for a primary read, and
`isServiceUnavailable` / `serviceUnavailableMessage` are the primitives. A 503
raised by a service's own `ServiceClient` names the service that failed, so the
message can say *which*. A 502 from the gateway cannot, and stays general.

**The sidebar is not gated on any of this.** It answers what this person may
do, not what happens to be up; see the note in
`packages/shared/src/composables/useMenuVisibility.ts`.

## Four things the copy did not bring with it

`pnpm run validate` failed on all four after the extraction, and the next app
added later will hit the same ones:

- **`tsconfig.node.json` included only `vite.config.ts`.** `api-routes.config.ts`,
  `vitest.smoke.config.ts` and `smoke/**` were in no tsconfig at all, so the
  typed lint could not see them. It reports that as a parsing error, not as a
  missing file.
- **`src/vite-env.d.ts` had no `ImportMetaEnv`.** `vite/client` types `VITE_*`
  through an index signature, so `import.meta.env.VITE_API_BASE_URL` is `any`
  and everything downstream of it in `api.ts` is an unsafe-`any` error.
- **`useBreadcrumbs.spec.ts` needs `// @vitest-environment happy-dom`.** It is
  the one spec in `packages/shared` that mounts a real component; the rest run
  under `node`, and without the pragma it fails with `document is not defined`.
- **Three files carry fixes academic-web already made**: `authSessionService`'s
  typed `JSON.parse`, and `||` → `??` in `AddressInfoTab` and `ChartStyle`.
  They are the same file in two repositories, so they change in both.

## Admin on-behalf registration

An administrator can now register an applicant and fill the whole form for
them, for the families who come to the office with a folder and no email habit.
The button lives on `/admin/applicants` and opens two dialogs in sequence:
`RegisterApplicantDialog` creates the account and its DRAFT application, then
`AdminApplicationFormDialog` hosts the same seven step components the applicant
path uses, with `editable` flipped on.

The step components take state through `v-model` and never ask who is filling
them, so the admin host reuses them unchanged. Only the lookup differs. The
applicant endpoints resolve the application from the access token
(`findMyApplication`, `findMyDetail`, `findApplicationForUpload`,
`findApplicationWithPayment`); the on-behalf endpoints take the application id
in the path and resolve it by id instead. The writes already keyed on the
application id, so the four use cases gained an `executeForApplication` entry
point that shares the body with their existing `execute`.

The administrator sees the generated password once, at the end, and is told so.
The API does not echo it.

## Google sign-in

`/login` shows "Masuk dengan Google" below the password form. The browser
leaves for identity-service, so the access token never passes through a URL:
identity-service sets the same HttpOnly refresh cookie as a password login, and
`/oauth/callback` calls `POST /auth/refresh` to mint the first access token.

### The sign-up entry point on the login page

Signing out lands on `/login`, and that page used to be a dead end for anyone
without an account: it offered sign-in and Google sign-in, and nothing that led
to registration. Once feature 002 removed the standalone `/register` form, the
only remaining way to reach sign-up was to already know to visit the landing
page.

`LoginForm.vue` now renders a `Belum punya akun?` line with a `Daftar` link when
the app configures one. It is driven by two new `authConfig` fields:

| Field | Default | Meaning |
|---|---|---|
| `signUpUrl` | `null` | Where the link points. `null` renders no link at all. |
| `signUpLabel` | `Belum punya akun?` | The sentence before the link. |

`admission-web` sets `signUpUrl: '/register'` in `src/app/main.ts`, which is the
existing redirect into `/?signup=1`, so the link opens the sign-up dialog. The
default is `null` on purpose: `LoginForm.vue` is mirrored into six sibling apps
that have no sign-up flow, and a hard-coded link would hand them a route that
does not exist. Those copies keep the default and render nothing.

`LoginForm.vue` and `authConfig` are the first files in this repo that
deliberately differ from their siblings. Set a field, do not add a link.

A Google email with no role lands in a state that says the account is not
registered, because identity-service creates the user but grants no role, and
this app treats "no role" as "not an applicant or an admin yet". Google
**sign-up** is the answer to that, and it is opt-in per deployment. See below.

## Sign-up is a dialog, not a page

There is no `/register` screen. It used to be a page with its own form, its own
wave picker and a phone field; a visitor landing there was asked to choose a
wave they had no basis to choose, and the page and the form then disagreed about
which wave was in play. `/register` is now a redirect to `/?signup=1`, which
opens `SignUpDialog` on the landing page and clears the query.

The dialog asks for name, email, password and confirmation, and nothing else.
No phone, no wave, no wave list. The wave is resolved **server-side** from the
active waves, so nobody picks one and there is nothing to disagree about. On
success the dialog signs the new applicant in (registration returns no session,
and the form is behind `requiresAuth`) and routes to `/registration/form`.

The wave still appears in the form, now as a locked `Gelombang Pendaftaran`
field showing the wave name and its academic year. It is display only: it is
never part of a step payload. A signed-in account that owns no application gets
one from `POST /admissions/my-application/ensure`, which is idempotent. The
existence read runs before any create, so a repeat call returns the same
application rather than a second registration number.

Google sign-up lives in the same dialog as a second control, so the entry points
did not multiply: the navbar, hero, wave section and closing call-to-action all
open the one dialog. It only creates an account when the deployment enables
`GOOGLE_SIGNUP_ENABLED` on identity-service. When it is off, the visitor is told
sign-up is not open instead of being handed a roleless account, and no refresh
cookie is set.

The return origin is not free text. `GET /auth/google?redirect=<origin>`
accepts the value only when it is in `GOOGLE_OAUTH_REDIRECT_ALLOWLIST`, carries
it through Google as OAuth `state`, and re-checks it on callback. An origin that
is not listed falls back to `GOOGLE_OAUTH_SUCCESS_REDIRECT_URL`. Each entry is a
bare origin, no path and no trailing slash.

## The landing page stopped promising a wave choice

The wave is resolved server-side, so the landing page no longer asks anyone to
choose one. Three strings changed: the FAQ answer, the wave section heading, and
the per-card button. The heading is now "Gelombang pendaftaran yang sedang
dibuka", the sub-text says the system places the new account on the open wave,
and the per-card button reads "Daftar Sekarang" like every other entry point
into the dialog. Asking for a wave the form cannot carry out was the finding.

The same pass removed decoration that had no written purpose: four blurred
radial orbs (two in `LandingHero.vue`, two in `LandingCta.vue`, plus one more in
`LandingWaveSection.vue` found while editing), the glass capsule the hero used
for its eyebrow text, and the `ArrowRight` glyph on all five register CTAs. The
hero eyebrow is now plain `text-white`, so the sentence is unchanged and only
the capsule is gone. The dialog, the navbar, and the flow are untouched.

Two contrast fixes came with it: the closing CTA's paragraphs were
`text-white/80` and `text-white/85` on `bg-primary` (3.87:1 and 4.15:1, both
under AA) and are now solid `text-white` (5.09:1). The shared `--input` token
moved from `oklch(0.928 0.006 264.531)` to `oklch(0.64 0.006 264.531)` in all
seven apps, so a form control's edge now measures 3.37:1 against a card instead
of 1.24:1; `--border` is unchanged.

## The two screens that used to go white

`/registration` and `/registration/form` render nothing when the signed-in
account owns no application. Both views branched on `loading` and then on
`application`, and had no third branch. An admin who followed the menu there got
a blank page and no way to tell a bug from an empty state.

Both now end in a `v-else` that names what is missing and offers the action that
matches the account: an admin goes to `/admin/applicants`, anyone else is sent to
the landing page's sign-up dialog (`/?signup=1`) from the dashboard or to
`/registration` from the form. Neither empty state renders an applicant-only
write control.

## Commands

```bash
pnpm install
pnpm run dev        # http://localhost:5175
pnpm run validate   # format:check + lint + typecheck + lint:strict + test + build
```

`pnpm-workspace.yaml`'s `allowBuilds` pre-approves the postinstall scripts
pnpm 11 blocks by default.
