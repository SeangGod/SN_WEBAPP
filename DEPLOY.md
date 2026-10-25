# Deploying this site for free

Your site is plain HTML, CSS, JavaScript and images. No build step, no server, no
database. That means every major host will take it, and the good ones are free.

**Recommendation: Cloudflare Pages.** Unlimited free static requests, 100 projects,
no expiry, no commercial-use restriction, free custom domain with HTTPS. It is the
only one of the four big free hosts that doesn't restrict what your site is *for*.
GitHub Pages and Vercel Hobby both forbid commercial use on the free tier, which
rules out ads or affiliate links later.

---

## Option 1 — Cloudflare Pages, drag and drop (fastest, no Git)

Takes about two minutes. No command line.

1. Sign up at **dash.cloudflare.com**. A free account is enough.
2. Open **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
3. Name the project. This becomes your address: `yourname.pages.dev`.
4. Drag the whole `my-website` folder in. Or zip it and drag the zip.
5. **Deploy.** Your site is live.

Limits on the free plan: 1,000 files per drag-and-drop upload (20,000 via CLI),
25 MiB per file, 500 builds a month. Your site is 14 files and about 120 KB, so
none of that is close.

To update later: open the project, drag a new copy in, deploy again.

---

## Option 2 — Cloudflare Pages via GitHub (auto-deploys on every push)

Better long term. Push a change, the site rebuilds itself.

**Step 1 — create the GitHub repo.**

```powershell
# install the GitHub CLI if you don't have it
winget install --id GitHub.cli

# authenticate once
gh auth login
```

Then, from the site folder:

```powershell
cd C:\Users\Seang\Desktop\my-website
gh repo create thong-portfolio --public --source=. --push
```

That creates the repo and pushes your existing commit. No web UI needed.

**Step 2 — connect it to Cloudflare.**

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Authorise GitHub, pick `thong-portfolio`.
3. Build settings — this is the part people get wrong:
   - **Framework preset:** `None`
   - **Build command:** leave **empty**
   - **Build output directory:** `/`
4. **Save and Deploy.**

There is no build command because there is nothing to build. The files are already
the finished site. Setting a build command here will break the deploy.

Every future `git push` redeploys automatically.

---

## Option 3 — GitHub Pages (simplest if you already use GitHub)

Free, no expiry, 100 GB bandwidth a month, custom domain with HTTPS.

```powershell
cd C:\Users\Seang\Desktop\my-website
gh repo create thong-portfolio --public --source=. --push
```

Then in the repo: **Settings** → **Pages** → **Source: Deploy from a branch** →
**Branch: `main`** (or `master`), folder **`/ (root)`** → **Save**.

Live at `https://yourusername.github.io/thong-portfolio/` in about a minute.

**The catch:** GitHub's own terms say Pages is not for running an online business,
e-commerce, or a SaaS. A portfolio is exactly what it's for. Ads are not.

Note: your local branch is currently `master`. GitHub Pages defaults to `main`.
Either rename it (`git branch -M main`) or pick `master` in the dropdown.

---

## Option 4 — Netlify Drop (no account, instant link)

Drag the folder onto **app.netlify.com/drop**. You get a `netlify.app` link in
seconds. Until you claim it with an account, the site sits behind a password.

**The catch, and it's a real one:** Netlify's free plan now runs on credits. 300 a
month, where each production deploy costs 15 and each GB of bandwidth costs 20.
That's roughly 20 deploys, or about 15 GB of traffic. When you run out, **every
site on the account is paused** and visitors see "Site not available."

Fine for a quick share. Not what I'd put a portfolio on.

---

## Free tier comparison

Checked October 2026. Free plans change often, so confirm before you commit.

| | Cloudflare Pages | GitHub Pages | Netlify Free | Vercel Hobby |
|---|---|---|---|---|
| **Bandwidth** | Unlimited static | 100 GB/mo | 300 credits/mo (~15 GB) | 100 GB/mo |
| **Builds** | 500/mo | 10/hour | 15 credits each | 100/day |
| **Projects** | 100 | 1 per repo | 500 per team | 200 |
| **Custom domain** | Yes, free | Yes, free | Yes, free | Yes, free |
| **Commercial use** | Allowed | Not for business | Allowed | Not allowed |
| **Expiry** | None | None | Pauses at limit | None |
| **Card required** | No | No | No | No |

---

## Custom domain (optional, about $10/year)

The only thing worth paying for. A `.com` runs roughly $10–11 a year.

**Buy at cost:** Cloudflare Registrar sells domains at wholesale with no markup,
so the renewal price equals the first-year price. Most registrars lure you in
cheap and triple it on renewal.

Then: Cloudflare Pages project → **Custom domains** → **Set up a domain** → enter
it. If the domain is already on Cloudflare, DNS is configured for you. HTTPS is
automatic and free.

**Free email on that domain:** Cloudflare Email Routing forwards
`you@yourdomain.com` to your Gmail at no cost. Incoming only, no sending.

---

## Before you deploy

- [x] `index.html` at the top level of the folder — the host looks for it first
- [x] All asset paths are relative (`styles.css`, not `/styles.css`), so it works
      from a subdirectory like `username.github.io/repo/`
- [x] `404.html` present — Cloudflare Pages and GitHub Pages pick it up automatically
- [x] `.gitignore` in place
- [ ] Swap the placeholder email `hello@example.com` in `index.html`
- [ ] Point the social links at your real profiles
- [ ] Replace the placeholder work entries with real projects

---

## Common failures

**404 after deploy.** The host can't find `index.html`. It must be at the top of
the folder you uploaded, not inside a subfolder. If you zipped the folder, zip its
*contents*, not the folder itself.

**Blank page, no styling.** `styles.css` didn't upload, or the path is wrong. Check
the browser console.

**Animations don't run.** `script.js` is missing, or it's loading before the DOM.
It must stay at the end of `<body>`.

**Build fails on Cloudflare.** You set a build command. There isn't one. Clear it
and set the output directory to `/`.

**Site paused on Netlify.** You burned the 300 monthly credits. Wait for the
month, upgrade, or move to Cloudflare.

**Custom domain shows "not secure".** The free certificate can take a little while
to issue. Check the DNS record points at the project, then wait before changing
anything.
