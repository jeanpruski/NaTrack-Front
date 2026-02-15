# Strava Developer Program Submission (NaTrack)

## Summary
NaTrack is a sports tracker where users log sessions and collect challenge/event cards. We integrate Strava to automatically import the **latest running activity** into NaTrack, so users don’t need to enter distance manually.

## Strava Usage
- OAuth: Connect with Strava (official button)
- Webhook: activity create
- API: fetch activity by `object_id`
- Filter: `type = Run` only
- Dedup: `strava_activity_id`
- Store: `distance` (meters) + `date` + optional `start_datetime`

## Privacy & Data
- We only read activity data required for the feature (distance, start date/time, type).
- Users can disconnect at any time (removes Strava tokens).

## Branding & Attribution
- We use the official **Connect with Strava** button (per Strava Brand Guidelines).
- We do not imply Strava sponsorship.
- We do not use Strava logos as our app icon.

## Required Screenshots (prepare)
1. **Settings → Strava** panel showing the Connect with Strava button.
2. **Connected state** showing “Strava connecté”.
3. **Import logs** showing latest Strava imports.

## Links to Include
- App URL: https://natrack.prjski.com
- Callback URL: https://natrack.prjski.com/api/strava/callback
- Webhook URL: https://natrack.prjski.com/api/strava/webhook

## Notes for Review
- Single Player Mode blocked additional athletes. We are applying for multi‑athlete access.
- Default rate limits are respected; import is per‑activity via webhook.

