/**
 * Montana's C-6 independent-expenditure grid has no structured
 * support/oppose field at all (confirmed against the live API response
 * shape); filers only narrate it in free text. Beyond direct sentiment
 * words, this also catches the "explaining/exposing a candidate's vote on
 * X" and "voting record" framing that this dataset's attack-style
 * committees use almost exclusively instead of ever saying "oppose" (a
 * candidate's own supportive spending describes them directly; it never
 * narrates a third party's vote), plus a "(No <Name>, ...)" scorecard
 * shorthand seen in multi-candidate line items. "vote for" is deliberately
 * NOT treated as a support cue: in this corpus it almost always continues
 * "...vote for [some spending/policy]" (attack framing), not "vote for
 * [candidate]" (the classic GOTV phrasing it would suggest). Text with
 * none of these cues has no explicit signal, and callers should treat
 * direction as unknown rather than guessing.
 */
const OPPOSE_RE =
  /\b(oppose[sd]?|opposing|against|defeat(?:ing)?|attack(?:ing)?|expos(?:e|ing)|reject|no on|vote no|negative|voting record|voted to (?:send|fund)|votes? to raise|conflict of interest)\b/i;
const OPPOSE_NARRATIVE_RE = /\bexplain(?:s|ing|ed)?\b[^.]{0,60}\bvotes?\b/i;
const OPPOSE_SCORECARD_RE = /(^|\()\s*no\s+[a-z]/i;
const SUPPORT_RE = /\b(support(?:ing)?|endorse[sd]?|endorsing|back(?:ing)?|elect|re-?elect|positive|in favor)\b/i;

export function inferSupport(text: string): { support: boolean; explicit: boolean } {
  if (OPPOSE_RE.test(text) || OPPOSE_NARRATIVE_RE.test(text) || OPPOSE_SCORECARD_RE.test(text)) return { support: false, explicit: true };
  if (SUPPORT_RE.test(text)) return { support: true, explicit: true };
  return { support: true, explicit: false };
}
