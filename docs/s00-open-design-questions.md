# S00 open design questions (for Gate S00-CP)

Items that no source fixes. The builder chose a default so work could continue; each needs Jo's approval or amendment at Gate S00-CP. Maintained by the S00 agent; copied into the checkpoint package.

## Carried from the planning phase (listed in the Gate S00-CP story)

1. Toast texts "Ressursen er opprettet.", "Ressursen er lagret." and "Ressursen er arkivert." (Story 1.13).
2. Slot-picker refusal texts (see item 5 below for the draft wording).
3. The `?ny=1` address parameter for opening the booking sheet or resource form.
4. AD-5 reads a booking start as strictly after now (`start > now`); the PRD default DEC-08 says `start >= now`. Contracts implement `start > now` (Story 1.2).

## Raised while building Stories 1.1-1.7

5. Field-level Norwegian messages in `packages/contracts/src/errors.ts` (`fieldMessageNb`). Fixed by EXPERIENCE.md: "Maks 200 tegn." and "Maks 4 timer.". Proposed by the builder: "Må fylles ut.", "Ugyldig verdi.", "Velg et gyldig klokkeslett.", "Velg hele eller halve timer.", "Velg et tidspunkt mellom 08:00 og 22:00.", "Sluttid må være etter starttid.", "Minst 30 minutter.", "Tidspunktet har passert.". "Du kan booke inntil 30 døgn frem i tid." is approved copy.
6. `BOOKING_STARTED` details carry `action: "approve" | "cancel"` (besides `currentStatus`) so the client and the server can choose between the two approved wordings; AD-4 lists only `currentStatus`.
7. `FIELD_ERROR_CODES` (REQUIRED, TOO_LONG_TEXT, INVALID, the booking time codes, IN_PAST, BEYOND_HORIZON) are the machine codes of `fieldErrors[].code`; AD-4 leaves the field-error code vocabulary open.
8. A booked slot reads "taken" even after it has started, "past" otherwise (EXPERIENCE.md Flow 1 shows 09:00 as opptatt while 08:00 is passert).
9. Layer reading for lint (Story 1.1, `docs/stack-note.md`): `ui` may import `i18n/*` and `api/links`; `api` may import `i18n/format`; the diagram is ambiguous on these arrows.
