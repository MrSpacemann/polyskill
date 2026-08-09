# Link-acquisition field run — 2026-08-09

Executed live (agent-driven) to field-test the tactics before writing seo-beast v1.9.0's
"Link Acquisition Playbook". Everything below actually happened on this date.

## Baseline (DataForSEO backlinks/summary, 2026-08-09)

```json
{ "rank": 120, "backlinks": 25, "referring_domains": 6,
  "referring_main_domains": 6, "referring_domains_nofollow": 2 }
```

Re-run the same call ~4–6 weeks after the PRs below merge; `referring_domains` is the number to watch.

## Done (agent, autonomous)

| Action | Result | Link |
|---|---|---|
| Repo homepage + description + 8 topics set (was ALL empty) | live | github.com/MrSpacemann/polyskill |
| PR → travisvn/awesome-claude-skills (14.5k★), Tools section | open | [#1096](https://github.com/travisvn/awesome-claude-skills/pull/1096) |
| PR → karanb192/awesome-claude-skills (473★), Community Resources | open | [#193](https://github.com/karanb192/awesome-claude-skills/pull/193) |
| PR → jqueryscript/awesome-claude-code (492★), Tools & Utilities | open | [#578](https://github.com/jqueryscript/awesome-claude-code/pull/578) |
| Issue-form submission → hesreallyhim/awesome-claude-code (52k★) | **validation bot: all checks passed**, awaiting maintainer | [#2472](https://github.com/hesreallyhim/awesome-claude-code/issues/2472) |
| rel-attribute verification: every polyskill.ai link on the GitHub repo page | `rel="nofollow"` (confirmed by curl) | — |

Skipped deliberately: ComposioHQ/awesome-claude-skills (72k★) — its CONTRIBUTING only accepts
actual skill folders, not tool-link entries; a link PR is a guaranteed reject. A future path:
submit an actual PolySkill-related *skill* there.

## Blocked on human (account creation / OAuth / payment — agent hard boundary)

- **uneed.best** — best of the launch platforms (real community, stated dofollow, 10.5k-subscriber
  newsletter). PAID: $4.99 waitlist / $29.99 pick-your-day. Needs account + payment. Worth it when
  ready to "launch" properly.
- **whatlaunched.today, ctrlalt.cc, useneedle.net, abacklaunch.com** — free tiers, all
  OAuth-walled (verified abacklaunch directly: Google/GitHub sign-in wall before the submit form).
  If you create the accounts and stay signed in to Chrome, an agent can fill every submission form.
- **G2** — needs company profile claim with business-email verification. Highest AI-citation value
  of the directory tier.

## Field lessons (now encoded in seo-beast v1.9.0 playbook)

1. Viral listicle DR numbers are unverified marketing: abacklaunch was listed as DR 26 while its
   own homepage commits only to "DR 10+" (consistent, but nothing supports the specific number —
   measure before trusting). Two of the 18 sites on the viral list ("reclaim.ai", "modal.com")
   offer only links inside logged-in account pages — never indexed, worth zero.
2. Every awesome list has a different intake: PR vs issue-form-only (hesreallyhim, enforced by
   bot + eligibility gates: 14 days active dev OR 100★), one-resource-at-a-time rules, and
   skill-folders-only lists where link PRs auto-fail.
3. GitHub issue forms silently drop programmatically-set checkbox values — checkboxes need real
   clicks. One form contains a literal attention trap ("Do not check the following box").
4. GitHub repo/README links: all `rel="nofollow"`. Value = crawl path + AI-engine scraping +
   GitHub topic discovery, not PageRank.
