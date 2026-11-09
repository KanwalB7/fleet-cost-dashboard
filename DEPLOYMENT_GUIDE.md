# Roadmap: From downloaded files to a live intrental partnertive presentation

## 1. Know what you are publishing

The download contains the public-safe dashboard code. **Do not publish the separately supplied private working-case JSON** or confidential dealership notes. GitHub Pages hosts a public-facing website; repository visibility does not guarantee that the Pages website itself is private.

## 2. Test locally (no account required)

- Unzip the dashboard package.
- Double-click `index.html` and open it with Chrome/Edge. **No installations required.**
- Move utilization from 80 to 60. Notice rental invoice and the gap decrease immediately.
- Switch 2 / 3 / 4 years. Watch the resale and ownership cost numbers change.
- Select **Load scenario .json** and choose the separate private working-case JSON (only on your own device). This restores the exact figures from the earlier model.
- The model displays positive financial gaps as **additional rental costs**, not savings.

## 3. Create a GitHub repository (website method, simplest)

1. Sign in at [github.com](https://github.com).
2. Click the `+` menu in the top-right corner → **New repository**.
3. Repository name: `fleet-cost-dashboard` (or any name you like).
4. Choose **Public** for the straightforward GitHub Pages setup on GitHub Free. Do not add confidential materials.
5. Click **Create repository**.
6. On the new repository, use **uploading an existing file**, or **Add file → Upload files**.
7. **Upload the extracted files**, especially `index.html`, `styles.css`, `model.js`, `app.js` and `.nojekyll`. Do **not** upload just the ZIP file; GitHub Pages needs `index.html` at the publishing root.
8. Add a commit message, such as `Add intrental partnertive fleet financial dashboard`, then commit.

## 4. Turn on GitHub Pages

1. Open your repository on GitHub.
2. Click **Settings → Pages** (under Code and automation).
3. Under Build and deployment, **Source**: `Deploy from a branch`.
4. Choose branch `main` and folder `/(root)`, then **Save**.
5. Let GitHub finish deploying, then refresh **Settings → Pages** and open the published URL.
6. Your expected address is `https://YOUR-USERNAME.github.io/fleet-cost-dashboard/` if your repository is named `fleet-cost-dashboard`.
7. If it does not appear, confirm `index.html` is in the root and check **Actions** for the Pages deployment status.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 5. (Optional) Publish using Terminal instead

Install Git, create the remote empty repository as above, then run from the **extracted website folder**:

```bash
git init
git branch -M main
git add index.html styles.css model.js app.js README.md DEPLOYMENT_GUIDE.md .nojekyll tests
git commit -m "Build intrental partnertive fleet cost dashboard"
git remote add origin https://github.com/YOUR-USERNAME/fleet-cost-dashboard.git
git push -u origin main
```

Authenticate when GitHub prompts you. GitHub does not accept account passwords for Git command-line Git authentication; follow the recommended Git Credential Manager/browser flow or use an authorized PAT.

## 6. Use it while presenting PowerPoint

**Option A — best live demonstration:** Place a **hyperlink** on your financial KPI slide, e.g. `Explore the live fleet cost model`. In PowerPoint, highlight the text/shape → **Insert → Link** → paste the GitHub Pages URL. When presenting, click the link. The website opens in the browser. Use `Alt + Tab` / `Cmd + Tab` to return to PowerPoint.

**Option B — audience participation:** Put the live URL on the last slide and create a QR code using your browser's Share / Create QR Code feature (availability varies). Test that scanning opens the GitHub Pages URL. Audience members can independently change inputs on their own phones. There is **no shared session**: their changes do not change your screen.

**Option C — offline backup:** Copy the extracted folder to your presentation laptop or a USB drive. Open `index.html` locally even without internet. Your live JSON import will also work offline. Keep a static PDF/screenshot backup in your deck in case screen-sharing links are blocked.

**Option D — screen-share live:** Open PowerPoint and the dashboard in two windows, use Presentation view in the dashboard, and screen share the appropriate window. Press `P` to show controls, modify a rate, and hide controls again.

## 7. Suggested on-stage sequence (3–5 minutes)

1. Open the dashboard and load your approved/verified assumptions locally.
2. Show the original 40-car fleet cost and the *per car/year* cost.
3. Change the holding period to 2, 3 and 4 years so stakeholders can see resale and annual depreciation move.
4. Move the utilization slider from 80% to 60% and show how billed rental days change.
5. Move the rental rate from $35 down toward the displayed break-even level. Make clear this is an **illustrative target, not an approved offered rate**.
6. Enter **verified incremental repair-referral contribution profit directly** (not gross referral sales). No contribution-margin input is used. Observe the modeled net benefit after reciprocal contributions.
7. Click `Copy summary` / `Export numbers` to capture a snapshot for follow-up.

## 8. Typical questions you will get

**Why does a 10-day rental not change annual rental cost?** At a *fixed utilization rate*, total rental days are already determined by fleet size, days/month, and utilization. The 10-day value controls the **number of contracts and handovers**. Change utilization or fleet size to change billed days.

**Why don't vehicle sale proceeds count as profit?** Because they return part of the initial acquisition cost. The difference between the purchase and sale values is depreciation. The model separates capital recovery from operating income.

**Does 20 hours/week save $22,500 of payroll?** No. It represents staff-time opportunity cost; cash savings require actual payroll reduction, and economic savings require productive redeployment.

**How is the $35/day mixed-payer base case calculated?** At 80% utilization, the 40-car replacement pool yields 40 × 0.8 × 30 × 12 = 11,520 rental days/year. Of these, 30% (3,456 days) are assumed shop-paid at the proposed $35/day rate = $120,960/year. The other 70% (8,064 days) are assumed eligible for insurance direct billing, subject to approval. Existing insurance-reimbursed rentals with the current rental provider are outside the owned-loaner conversion pool. The shop currently receives an assumed $0/day in insurer reimbursement on its owned free loaners in the working case.

**What if insurance covers rentals?** Enter only the genuinely verified third-party paid percentage. Do not automatically assume loss-of-use authorization for internal courtesy replacements.

## 9. Editing or improving the code

- Change colors and layout in `styles.css`.
- Add or edit input definitions in `app.js` (`groups`).
- Change calculations in `model.js` (`calculate`).
- Modify the title, headers and arrangement in `index.html`.
- Upload the changed files again through GitHub `Add file → Upload files` or push a Git commit. GitHub Pages republishes when the source updates.

## 10. Data security and permissions

The public ZIP uses rounded illustrative defaults and contains no original Excel statements. Keep the working-case JSON on your laptop and load it in the browser **only if your organization authorizes showing those figures**. GitHub Pages is not an access-controlled portal; do not treat hiding values behind a website input as security.

**References:**
- GitHub Pages static site hosting: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Pages publishing configuration: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Upload repository files: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
