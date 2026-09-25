# Nest: hours, calendar & school plans for our family and nanny

A small, friendly web app (Next.js, works on phones and can be added to the home screen) with:

- **Hours account.** The nanny logs her time with a one-tap *Start my day / Finish* timer or by entering times. The app compares what she worked with what is due and shows a running **balance** (+ ahead / − to make up).
- **Annual budget.** Shows how many hours are due over the whole year, how many are done, and where she should be today.
- **Vacation tracker.** 5 weeks a year, prorated in the first year.
- **Family calendar.** Appointments, activities, birthdays, *family away* and *nanny off* days, and school holidays. Events can be single-day, multi-day or weekly.
- **School & activities.** A weekly timetable for each child, with where, when, pick-up notes and what to bring.
- **French / German / English.** Each person picks their own language.

## How the hours are counted (from the contract)

| Contract | In the app |
|---|---|
| §5: 33.5 h per week, schedule agreed flexibly | Every workday (Mon–Fri, not a public holiday) counts as 33.5 / 5 = **6.7 h due**. All worked hours are credited. Long and short days balance out. |
| §10: 5 weeks vacation | 25 vacation days a year (7.5 in 2026, prorated). A vacation day credits 6.7 h. |
| §10: family on holiday, nanny not needed → salary paid, hours made up later | Nothing is credited on those days, so the balance goes negative and is made up later. Mark them in the calendar as *Family away* so everyone knows. |
| §9: sickness | A sick day credits 6.7 h. |
| §11: overtime compensated with time off within 3 months (at the latest 12), otherwise paid out without premium | The balance is tracked first-in, first-out. The dashboard warns when overtime is older than 3 months, and when it is older than 12 months it shows the payout amount at the hourly rate (CHF 4,365 × 12 / (33.5 × 52) ≈ CHF 30.07/h). A payout is logged as a negative *correction*. |

**Annual budget:** workdays in the year × 6.7 h − vacation days × 6.7 h. For 2027 that is 256 × 6.7 − 25 × 6.7 = **1,547.7 h**.

**Roles:** the nanny logs hours, which then show as *pending*. A parent confirms them, or everything at once with *Confirm all*. Only parents can enter corrections, edit confirmed entries, or change the settings. Both can edit the calendar and the timetable. Every month can be exported as CSV.

## Deploy on Vercel (about 5 minutes)

1. Import this GitHub repo on <https://vercel.com/new>. The framework is detected as Next.js automatically.
2. In the Vercel project, open **Storage → Create / Connect Database → Neon (Postgres)**. The free tier is plenty. This sets `DATABASE_URL`, and the tables are created automatically on first use.
3. In **Settings → Environment Variables** add:
   - `PARENT_PIN`: the parents' password
   - `NANNY_PIN`: the nanny's password
   - `SESSION_SECRET`: a long random string (`openssl rand -base64 32`)
4. Redeploy. Open the site, log in as a parent and check **Settings**: children's names, public holidays and so on.
5. On the phone, open the site and choose *Add to Home Screen*.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000, PINs: parent 1234, nanny 0000
npm test           # unit tests for the hours/balance logic
```

Without `DATABASE_URL` an embedded Postgres (PGlite) is stored in `./.data`.

## Where things are

- `lib/balance.ts`: all hour, balance, budget and vacation calculations (tested in `lib/balance.test.ts`)
- `lib/holidays.ts`: public holidays (defaults for Meyriez FR; editable in Settings)
- `lib/defaults.ts`: contract values used before anything is saved
- `app/(app)/*`: pages (dashboard, hours, calendar, schedule, settings)
- `app/actions.ts`: all writes, with permission checks
