# Approved copy and decisions — FELLES architecture

Approved by Jo on 2026-10-19 ("I approve the six recommended architecture decisions and the proposed architecture direction"). The Norwegian strings below are the architect's proposals recorded as approved by that blanket approval; they were not individually reviewed line by line. S00 copies them into the contracts message catalogue (`messages.nb`) and `i18n/nb/*`; any later wording change goes through the contract amendment path (AD-20) and, for tone, UX.

## The six approved decisions

1. **DEC-16 extension.** HTTP statuses 421, 429, 500, 501, 503 and the codes `UNAUTHENTICATED`, `BOOKING_NOT_CANCELLABLE`, `DATABASE_BUSY`, `HOST_REFUSED`, `ORIGIN_REFUSED`, `RATE_LIMITED`, `INTERNAL`, `NOT_IMPLEMENTED`, `OWN_REQUEST` are added; the activity list takes a `before` event-id cursor. Authorisation rules unchanged.
2. **Deviations from PRD §4.0.** Larger S00 (complete contract set with 501 stubs, UI kit including shared presentational components, test kit, lint boundaries, ownership and merge-gate scripts, session resolution and read, `countFutureBlocking`, `listEventsForBooking`); schedule endpoint in S03; `booking-actions` as its own feature; slices may add files to `ui/`, modifying a frozen primitive needs Jo. S00 is split into the spec's three tasks.
3. **PIL-09 checkpoint.** Jo reviews the contract draft (route table and DTO list) after T00-02, before S00 is accepted; S00 acceptance includes a hello-slice dry run.
4. **Two-step contract freeze.** F1 at S00 acceptance; F2 at S03 acceptance (activity, dashboard, final schedule DTO); afterwards additive amendments only, by one integrator commit on main approved by Jo.
5. **Chart semantics.** Expired requests are excluded from the pending bars; bars bucket by Oslo start day; the admin panel keeps the DEC-04 window.
6. **Copy.** The slot label for times beyond the 30-day limit and the error texts below.

Also approved: the proposed architecture direction (ARCHITECTURE-SPINE.md AD-1…AD-28), including DEC-11 and DEC-12 confirmed with refinements and DEC-16 confirmed (OQ-6 closed). Action item for Jo, not a decision: install Node 24 LTS (or Node 26 after 2026-10-28) before S00.

## UI copy (Norwegian bokmål)

| Place | Text |
| --- | --- |
| Slot beyond the 30-day limit (accessible name) | `klokken 14:00, utenfor bookingvinduet` (time varies) |
| Hint under the slot grid when such slots are shown | `Du kan booke inntil 30 døgn frem i tid.` |

## Error messages (`code` → `message`)

| Code | Message |
| --- | --- |
| `VALIDATION_FAILED` | Sjekk feltene og prøv igjen. |
| `UNAUTHENTICATED` | Økten er utløpt. Logg inn på nytt. |
| `INVALID_CREDENTIALS` | Feil e-post eller passord. |
| `FORBIDDEN` | Ingen tilgang. |
| `OWN_REQUEST` | Du kan ikke behandle din egen forespørsel. |
| `ORIGIN_REFUSED` | Forespørselen ble avvist av sikkerhetshensyn. Last inn siden på nytt. |
| `HOST_REFUSED` | Adressen er ikke tillatt. Åpne FELLES via localhost. |
| `NOT_FOUND` | Fant ikke det du lette etter. |
| `BOOKING_CONFLICT` | Tidsrommet er ikke lenger ledig. Velg et annet tidspunkt. |
| `BOOKING_NOT_PENDING` | Forespørselen er allerede behandlet. |
| `BOOKING_NOT_CANCELLABLE` | Bookingen er allerede avbestilt eller avslått og kan ikke avbestilles. |
| `BOOKING_STARTED` (approve) | Forespørselen har allerede startet og kan ikke godkjennes. Du kan fortsatt avslå den. |
| `BOOKING_STARTED` (cancel) | Bookingen har allerede startet og kan ikke avbestilles. |
| `RESOURCE_ARCHIVED` | Ressursen er ikke lenger tilgjengelig. |
| `RESOURCE_HAS_FUTURE_BOOKINGS` | Ressursen har {n} fremtidige bookinger og kan ikke arkiveres. (n = 1: Ressursen har 1 fremtidig booking og kan ikke arkiveres.) |
| `RATE_LIMITED` | For mange forsøk. Prøv igjen om {seconds} sekunder. (seconds = 1: … om 1 sekund.) |
| `DATABASE_BUSY` | Databasen er opptatt. Prøv igjen om et øyeblikk. |
| `INTERNAL` | Noe gikk galt hos oss. Prøv igjen. |
| `NOT_IMPLEMENTED` | Funksjonen er ikke ferdig ennå. |

Messages already fixed by `EXPERIENCE.md` (`UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `OWN_REQUEST`, `BOOKING_CONFLICT`, `BOOKING_NOT_PENDING`, `RESOURCE_ARCHIVED`, `RESOURCE_HAS_FUTURE_BOOKINGS`) are reproduced unchanged; the rest are new. Tone follows Voice and Tone: what happened, then what to do, no exclamation marks.
