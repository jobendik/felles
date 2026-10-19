# Editorial review (bmad-review, lenses structure → prose) — felles-pilot

Content class: docs (DESIGN.md + EXPERIENCE.md). Reader type: humans (architects and developers, many ESL). Style guide: Microsoft Writing Style Guide. Run 2026-10-19 as the `doc_standards` polish step of bmad-ux Finalize. Both lenses returned findings tables; this file records what was applied so the spines can be read without the transcripts.

## Structure lens — 20 recommendations

Applied:
- DESIGN.md → Components regrouped under Shell and navigation · Controls · Data display · Calendar · Overlays and feedback · Resource symbols and colours; every bullet runs anatomy/size → colour → type → states → mock pointer; the Booking detail sheet became its own bullet; the symbol and colour names became one table; the frontmatter `components` block states the "tokenised vs body-only" rule.
- EXPERIENCE.md → Component Patterns: Form (validation and submission), Slot picker, Calendar (week grid) and Booking detail sheet moved out of the table into subsections with a Behaviour · Keyboard · Accessible names · Edge cases schema.
- One home per rule: control sizing (DESIGN Layout & Spacing), scroll padding (EXPERIENCE Accessibility Floor), breakpoint dimensions (DESIGN) vs behaviour (EXPERIENCE Responsive), date/time formats (EXPERIENCE Voice and Tone → Formats), feedback timing (EXPERIENCE Interaction Primitives), form rules (Form subsection).
- The booking state diagram moved to the top of Key Flows; the "Defaults" row moved to the top of State Patterns and per-surface rows list only deviations.
- IA keeps structure; ARIA for the Mer button moved to the App shell row; the mock list collapsed to the index pointer.
- Key Flow headings shortened to "Flow N — Title (UJ-x)" with persona and time as the first line; variants and failures are bullets with bold leads; every flow opens with its mock pointer.
- Dangling pointers (memlog, `.working/`, "above") replaced with resolvable ones; "spines win on conflict" stated once per file; Brand & Style recap condensed to one sentence.
- Accessibility Floor condensed to cross-cutting rules plus the S07 test bar; component ARIA stays with the component.

Not applied, with reason:
- Collapsing the repeated `fontFamily` string in the typography frontmatter: the DESIGN.md spec has no default-family mechanism, so each role keeps its own.
- Dark-mode open question: kept as a one-clause item because Jo's explicit sign-off is wanted at this review.

## Prose lens — 32 findings

Applied: Utløpt/Venter as bold display labels, not code; single whole-word accessible names; the Form row resolves "disabled until valid" vs "disabled while empty"; "his own" → "Magnus's own"; "controls disable" → "inputs become read-only"; "Three working radii" → "Four working radii plus `full`"; Sheet bullet split with the Booking detail sheet as its own entry and "four instances"; Alert border named as the strong tone at 40% alpha; Badge and Demo pill use `caption-strong`; Foundation's booking rule split into three constraints; dangling modifier in IA fixed; `aria-current` sentence rewritten; counter sentence split and "180 or 200"; "end inclusive" explained; Date field prefill sources separated; Kalender empty-state wording; straight quotes in the Ressurser empty string; "more than two errors" clarified; Hjem replaces "dashboard" in prose (mock filename unchanged); one name per overlay and component; generic components lowercase in running text; Member/Administrator in prose; resource colour names unified ("Blågrønn"); sources named at first use; Targets sentence rewritten; abbreviations expanded ("for example", "including", "characters", "assistive technology", "sign-in", "email", "unarchiving"); numbers zero–nine spelled out in sentences; the attribution separator unified to "·"; the seven minor fixes.

Decided, not changed: British spelling kept (consistent with the PRD; stated once in Brand & Style). Unit formatting kept unspaced ("40px") in both files to match CSS and tokens, applied consistently in EXPERIENCE.md. DEC-14 is cited correctly for both the 200-character limit and the fixed symbol/colour lists; it covers both.
