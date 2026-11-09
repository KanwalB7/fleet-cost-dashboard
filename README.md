# Fleet Economics — Live ownership vs rental dashboard

A complete **HTML + CSS + JavaScript** intrental partnertive model. No Node.js, build tool, React install, data backend, account, API key, or third-party chart service is needed.

## Start

1. Open `index.html` in Chrome, Edge, Firefox or Safari, **or** publish the files using GitHub Pages.
2. Adjust the inputs in the left sidebar. The KPI cards, donut, annual cost comparison, 2/3/4-year hold comparison, cost table, and reciprocal-business target update immediately.
3. For the previously discussed working case, use **Load scenario .json** with the **separately supplied** `private-working-scenario.json (supplied separately; do not publish)`. Do not upload that JSON to GitHub.
4. Click **Presentation view** or press `P` while not editing a field to hide inputs. Press `P` again to open them. Use **Print / PDF** for an offline snapshot.
5. Click **Save scenario .json** to retain your inputs privately on your computer; **Export numbers** for a spreadsheet-ready CSV. The app does not automatically save data to cloud storage.

## Main financial formulas

- **Depreciation (per car, per year)** = `(Acquisition price − expected resale price) ÷ holding years`.
- **Resale at every hold length (2, 3, 4 years or custom)** = `Acquisition price × (1 − monthly depreciation %)^(12 × holding years)`. The old editable 2-year and 4-year separate retention assumptions have been removed.
- **Taxes & licence** = 12 × monthly proxy; OR annual registration + one-time plates / years + 12 × qualifying dealer-use tax + acquisition tax / years + other annual tax. **Do not use both methods at once.**
- **Maintenance** = 12 × `[ (external + internal) / 2 ]` by default. The user can select `Sum` or `Custom`.
- **Miscellaneous & liability** = 12 × (liability + general misc + fuel + optional additional insurance + enabled interest/reserve), plus annual uninsured damage cost.
- **Personnel** = annual salary × (loaner-management hours / full-time hours), plus any annual staffing supplement. Staff expenses for a partially retained fleet are allocated proportionally.
- **Owned annual cost** = sum of five annual per-car expenses × number of owned vehicles.
- **Rental billable days/year** = cars replaced × rental utilization × days/month × 12.
- **Average contracts/month** = billable days/month ÷ average contract length. Contract length affects turnover, **not rental-day cost** when utilization is held fixed.
- **Shop's replacement-rental expense** = converted loaner days/year × internal-rental percentage × shop-paid daily rate. The remaining insured portion is assumed reimbursed directly to the rental provider by the insurer, subject to coverage authorization. Shop receives no income on those replacement rental days.
- **Post-conversion annual cost** = remaining fleet ownership + shop's rental expense + on-site fees + transition cost annualized.
- **Accounting cost difference** = post-conversion annual cost − original net owned-fleet cost. **Positive means outsourcing adds cost**, negative means savings. The displayed **FINANCIAL GAP BEFORE REFERRALS** KPI presents its *opposite*, net savings, with **positive green** and **negative red**.
- **Verified reciprocal contribution** = directly entered incremental repair-referral contribution profit + vehicle buyback contribution profit + other reciprocal contribution profit + manually confirmed profit. No gross-sales-to-profit margin assumption is used.
- **Outstanding reciprocal contribution** = max(0, gap − verified reciprocal contribution profit).
- **Value to bridge paper rate to target effective rate** = (paper rate − target effective rate) × shop-paid annual rental days, floored at zero. This does not necessarily close the total ownership cost gap.
- **Net financial benefit before referrals** = original net ownership cost − post-conversion annual cost. **Positive is savings (green); negative is additional cost (red).** Referral contribution amounts must already be profit, not sales revenue.
- **Break-even internal daily rate** = (net avoided owned-fleet cost − incremental on-site/transition costs + verified reciprocal contribution) ÷ shop-paid internal days. The shop's insurance receipts on its *own* fleet, if any, are deducted from the ownership baseline; the default is $0/day.

## Working assumptions and limitations

The public website starts with **illustrative rounded inputs, including a proposed $35/day internal rate**, not the proprietary figures from any company's income statement. The separate private scenario JSON holds the exact working figures previously discussed, for local loading only. They are illustrative benchmarking inputs, not audited costs of any particular dealership.

The original analysis deliberately **excluded financing interest and physical-damage reserves**, averaged rather than summed the external/internal maintenance categories, used $3/month as an **assumed fuel target** (not a verified provincial average), and applied a monthly license/tax proxy rather than all-in Manitoba coverage. Those choices are preserved in the private working case and can all be changed.

A loaner supplied to customers free of charge earns no direct rental revenue. Selling it later **recovers capital** and does not create gross rental profit. The model treats the purchase-to-resale difference as depreciation. Changes to resale impairment may be modeled with a residual penalty; do not count the same loss twice as repair cost.

The 20-hour weekly personnel assumption is an opportunity cost: it becomes a cash saving only if employee hours or positions are eliminated, and it becomes an economic saving only to the extent the hours can be reassigned productively. Actual vehicle insurance and eligible dealership vehicle tax treatment require verification for the applicable jurisdiction.

The default comparison uses a **30-day month / 360-day commercial year** so it reproduces the presentation figures. Change `days per month` to 30.4167 if you want a 365-day annualized billing approximation.

All holding-period resale values use the **same configurable compounded monthly depreciation rate** (public default 1% per month), so 2-, 3-, and 4-year scenarios remain internally consistent. The 1% monthly rate is a favourable *assumption*, not a guaranteed market minimum.

## Publish on GitHub Pages

See `DEPLOYMENT_GUIDE.md`. Place `index.html`, `styles.css`, `model.js`, `app.js` and `.nojekyll` at the repository **root** and enable **Settings → Pages → Deploy from a branch → main → /(root)**.

### Security

**GitHub Pages sites are publicly accessible.** Do not commit Excel statements, proprietary costs, private customer information, or the private JSON file. Any scenario defaults embedded in public JavaScript are visible to everyone. JSON imported through the website stays in the local browser on that user's machine; the app does not transmit it, but browser extensions or an insecure screen-sharing environment could still expose what is displayed.

## Code structure

| File | Purpose |
| --- | --- |
| `index.html` | Website layout and dashboard components |
| `styles.css` | Responsive styling and print layout |
| `model.js` | All financial calculations and input validation |
| `app.js` | Live controls, charts, import/export and presentation mode |
| `DEPLOYMENT_GUIDE.md` | Full beginner-friendly GitHub and presentation walkthrough |
| `.nojekyll` | Tell GitHub Pages not to apply Jekyll processing |

All code is plain JavaScript. You can run tests with `node tests/model.test.js` if Node.js is installed. Node.js is **not** required to host or use the dashboard.

## New mixed-payer model (November 2026)

The live dashboard uses a **$35/day proposed shop-paid internal rental rate** in its base case. It is not an approved agreement. The dashboard has two mixed-payer scenario inputs under **Rental partner / deal**:

- **Internal rentals paid by the shop (%)**: 30% default. The remaining 70% are assumed insurance-eligible provider-direct-billed days; this must be verified and is **not** a guarantee of claim approval or reimbursement.
- **Insurer reimbursement earned by the shop on its *own* loaners ($/eligible rental day)**: $0 default. A positive amount reduces the original owned-fleet cost and any remaining owned cars' costs; it is **not** assumed to be revenue paid to the shop when the replacement rental provider supplies the vehicle.

The public demo uses a $35/day proposed *shop-paid* internal rental rate and a 40-car conversion pool. Existing insurance-funded rentals serviced by the current rental provider are outside the modeled conversion. At 80% utilization and a 30-day commercial month, 40 × 80% × 30 = 960 monthly rental days; 288 are shop-paid ($10,080 monthly) and 672 are assumed insurance-reimbursed directly to the provider. With an illustrative ownership benchmark of $187,387/year loaded from the separately supplied private scenario, the projected shop-paid rental cost is $120,960/year and the modeled reduction in shop costs is $66,427/year, before changes in operating costs or denied insurance claims. **Do not upload private financial assumptions to this public repository.**
