#!/usr/bin/env bash
# Weekly GSC tracking for polyskill.ai. Run: bash track.sh
# Writes snapshot-<date>.json and prints deltas vs the previous snapshot.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
GT="$(gcloud auth application-default print-access-token 2>/dev/null)"
QP="polyskill-seo"
SITE=$(jq -rn --arg u "sc-domain:polyskill.ai" '$u|@uri')
END=$(date -u +%Y-%m-%d)
START=$(date -u -v-28d +%Y-%m-%d 2>/dev/null || date -u -d '28 days ago' +%Y-%m-%d)
q(){ curl -s -X POST "https://www.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query" \
  -H "Authorization: Bearer $GT" -H "x-goog-user-project: $QP" -H "Content-Type: application/json" -d "$1"; }
TOT=$(q "$(jq -n --arg s $START --arg e $END '{startDate:$s,endDate:$e,rowLimit:1}')" | jq '.rows[0]//{}|{clicks:(.clicks//0),impressions:(.impressions//0),ctr:((.ctr//0)*1000|round/10),position:((.position//0)*10|round/10)}')
QUERIES=$(q "$(jq -n --arg s $START --arg e $END '{startDate:$s,endDate:$e,dimensions:["query"],rowLimit:20}')" | jq '[.rows[]?|{q:.keys[0],clicks,impressions,position:(.position*10|round/10)}]|sort_by(-.impressions)')
PAGES=$(q "$(jq -n --arg s $START --arg e $END '{startDate:$s,endDate:$e,dimensions:["page"],rowLimit:20}')" | jq '[.rows[]?|{page:.keys[0],clicks,impressions,position:(.position*10|round/10)}]|sort_by(-.impressions)')
COUNTRIES=$(q "$(jq -n --arg s $START --arg e $END '{startDate:$s,endDate:$e,dimensions:["country"],rowLimit:250}')" | jq '[.rows[]?|select(.keys[0]=="usa" or .keys[0]=="sgp" or .keys[0]=="chn")|{country:.keys[0],clicks,impressions,position:(.position*10|round/10)}]')
OUT="$DIR/snapshot-$END.json"
jq -n --arg s $START --arg e $END --argjson t "$TOT" --argjson q "$QUERIES" --argjson p "$PAGES" --argjson c "$COUNTRIES" \
  '{period:{start:$s,end:$e},totals:$t,top_queries:$q,top_pages:$p,target_countries:$c}' > "$OUT"
echo "✓ wrote $(basename "$OUT")"
echo "Totals (last 28d): $(echo "$TOT" | jq -c .)"
PREV=$(ls -1 "$DIR"/snapshot-*.json "$DIR"/baseline-*.json 2>/dev/null | grep -v "snapshot-$END.json" \
  | sed -E 's/.*-([0-9]{4}-[0-9]{2}-[0-9]{2})\.json/\1\t&/' | sort | tail -1 | cut -f2)
if [ -n "${PREV:-}" ]; then
  echo "Δ vs $(basename "$PREV"):"
  jq -n --argjson a "$(jq .totals "$PREV")" --argjson b "$TOT" \
    '{clicks:($b.clicks-$a.clicks),impressions:($b.impressions-$a.impressions),position_change:(($b.position-$a.position)*10|round/10)}' | jq -c .
else
  echo "(no prior snapshot yet — this is the baseline; deltas appear next run)"
fi
