# S00 design decisions and open questions (Gate S00-CP)

Items that no source fixed while S00 was built. The builder chose a default so work could continue; Jo decided each at Gate S00-CP on 2026-10-19. Maintained by the S00 agent and copied into the checkpoint package.

## Decisions recorded at Gate S00-CP (Jo, 2026-10-19)

| # | Item | Decision |
| --- | --- | --- |
| 1 | Toast texts "Ressursen er opprettet.", "Ressursen er lagret." and "Ressursen er arkivert."; the `?ny=1` address parameter that opens the booking sheet or the resource form | **Approved** as proposed (Story 1.13 and later). |
| 2 | Booking start rule | **Approved: `start > now`** everywhere (create, cancel, approve; AD-5). **Intentional deviation from PRD DEC-08**, whose default reads `start >= now`: a booking whose start equals the current instant is refused, and a pending request whose start is at or before now is Expired (`start <= now`), so the two rules never overlap. Implemented in `packages/contracts/src/rules.ts` (`isInFuture`, `isExpired`, `canCancel`, `canApprove`) with tests at `start == now` and `now ± 1 ms` (`packages/contracts/test/rules.test.ts`). |
| 3 | Field-level Norwegian messages (`fieldMessageNb`) | **Approved**, keeping wording fixed by the UX specification: "Maks 200 tegn.", "Maks 4 timer." and **"Navn er påkrevd."** for an empty resource name (EXPERIENCE.md, RES-03). The builder's other texts stand: "Må fylles ut." (any other required field), "Ugyldig verdi.", "Velg et gyldig klokkeslett.", "Velg hele eller halve timer.", "Velg et tidspunkt mellom 08:00 og 22:00.", "Sluttid må være etter starttid.", "Minst 30 minutter.", "Tidspunktet har passert.". The contract change for "Navn er påkrevd." is in `requiredMessageNb` (`errors.ts`). |
| 4 | `BOOKING_STARTED` details carry `action: "approve" \| "cancel"` besides `currentStatus` | **Approved.** Extends AD-4's `currentStatus`; selects between the two approved wordings. |
| 5 | `FIELD_ERROR_CODES` vocabulary (REQUIRED, TOO_LONG_TEXT, INVALID, the booking time codes, IN_PAST, BEYOND_HORIZON); a booked slot reads "taken" even after it has started, "past" otherwise | **Approved.** |
| 6 | Layer reading for lint (`docs/stack-note.md`): `ui` may import `i18n/*` and `api/links`; `api` may import `i18n/format`; `i18n` imports no other web layer | **Approved.** |

Resulting contract change: only item 3 (the specific required-field wording). The database schema is unchanged.

## Still open for later checkpoints

- Slot-picker refusal wording for the picker's own messages (END_BEFORE_START, START_UNAVAILABLE, CROSSES_UNAVAILABLE) is built in Story 4.6; "Maks 4 timer." is already fixed. Wording is decided with that story.
