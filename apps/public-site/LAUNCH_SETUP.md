# Launch setup

## Supabase sign-in and Dedication Awards

1. Create a Supabase project and enable **Email** under Authentication providers.
2. In Authentication URL Configuration, add the final Pages domain as the Site URL and redirect URL.
3. Run `supabase/migrations/20260829151500_dedication_awards.sql` and `supabase/migrations/20260830001000_crumb_submissions.sql` in the Supabase SQL Editor.
4. Copy the project URL and **anon** key (never the service-role key) into `auth-config.js`.
5. Issue an award with a recipient email and a warm greeting:

   ```sql
   insert into public.dedication_awards (recipient_email, greeting)
   values ('recipient@example.com', 'Your place at the table is here when you are ready.')
   returning code;
   ```

6. Make the QR code point to `https://wenevergonnaclose.com/?award=THE_RETURNED_CODE`.

The QR contains only an award code. The recipient must verify with the email address assigned to that award; the database binds the award to the authenticated user and rejects a different email or a previously claimed award.

The site uses only the three voluntary welcome answers (branch, menu course, and intent) to tailor the e-store and free-resource area. Those answers remain in the browser for anonymous visitors and are saved to the signed-in member's profile only after authentication.

Crumb submissions require authentication and enter a private `pending` review queue. Review submissions in the Supabase Table Editor with an owner account or service-role workflow; publish only approved material after checking source rights, privacy, and usefulness.

## Domain cutover

Enable Pages from GitHub Actions and verify its generated URL and HTTPS status before
changing DNS at the domain provider. Retain existing email and verification records
(MX, SPF, DKIM, DMARC, and TXT). The repository does not configure DNS or redirects;
see [the repository cutover guide](../../docs/CUTOVER.md).

## Storefront handoff

Keep `storefront-config.js` committed with `storefrontUrl: ""` until the separate Shopify + Printful storefront is live and verified. After launch, set it to the full HTTPS storefront URL and publish this repository. This file is public configuration only: never add Shopify, Printful, payment, or service-role credentials. The site ignores missing, malformed, non-HTTPS, and credential-bearing URLs, leaving the Made by +U, 4 ALL Goods Window browse-only. Cash App remains voluntary support and does not purchase merchandise.
