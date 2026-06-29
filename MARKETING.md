# Marketing links (UTM tracking)

HOA Daddy tracks where visitors and sales come from. Add UTM tags to any link
you post on social, in emails, or in ads, and it shows up in
**Admin → Analytics → 📣 Marketing** (Channels + Campaigns), including the
**revenue** each one drives. Attribution is sticky for the whole visit, so a
purchase a few clicks after landing still traces back to the right source.

## The convention

```
https://hoadaddy.com/?utm_source=<where>&utm_medium=<type>&utm_campaign=<name>
```

- **utm_source** — the platform: `instagram`, `tiktok`, `facebook`, `email`, `google`
- **utm_medium** — the bucket (drives the "Channel"): `social`, `email`, `cpc` (paid), `referral`
- **utm_campaign** — your label for the post/promo: `bio`, `spring-launch`, `reel-jan`, etc.

`utm_medium=social` → shows under the **Social** channel. `utm_medium=cpc` → **Paid Search**.
`utm_medium=email` → **Email**.

## Ready-to-paste links

**Instagram**
- Bio link: `https://hoadaddy.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio`
- A specific post/reel: `https://hoadaddy.com/?utm_source=instagram&utm_medium=social&utm_campaign=reel-spring`
- Stories "link" sticker: `https://hoadaddy.com/?utm_source=instagram&utm_medium=social&utm_campaign=story-promo`

**TikTok**
- Bio link: `https://hoadaddy.com/?utm_source=tiktok&utm_medium=social&utm_campaign=bio`
- A specific video: `https://hoadaddy.com/?utm_source=tiktok&utm_medium=social&utm_campaign=video-jan`

**Email**
- `https://hoadaddy.com/?utm_source=email&utm_medium=email&utm_campaign=newsletter`

## Tips

- Keep `utm_campaign` names short, lowercase, and consistent (use `-` not spaces)
  so they group cleanly in the Campaigns table.
- Use a **different `utm_campaign`** per post/promo to compare them; reuse the
  **same** one across a campaign to total it up.
- Link shorteners are fine — the tags just need to be on the final
  hoadaddy.com URL the shortener points to.
- No tags? Traffic still counts — it just lands under the **Social** /
  **Organic Search** / **Direct** channel based on the referrer, without a
  campaign name.

## Later: native social stats

Pulling follower/reach/post stats *out of* Instagram & TikTok into this
dashboard is a separate, larger project (Instagram Graph API + TikTok API, each
needing a developer app and platform approval). The UTM setup above covers
"how much traffic and revenue social drives" without any of that.
