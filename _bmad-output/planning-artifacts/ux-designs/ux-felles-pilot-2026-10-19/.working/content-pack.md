# FELLES content pack for mock renderers (shared, authoritative for strings)

Today in all mocks: **mandag 19. oktober 2026, kl. 09:12** (Europe/Oslo). Current week: **Uke 43 · 19.–25. okt. 2026**.
UI language: Norwegian bokmål. Code/tokens in English. No lorem, no emoji, no exclamation marks.

## People
- Ingrid Haugen — Medlem (member). Initials IH.
- Jonas Dahl — Medlem. JD.
- Magnus Berg — Administrator. MB.
- Sofie Lund — Administrator. SL.

## Resources (kind · location · seats · symbol · colour · approval)
Rooms:
1. Fjellet — Møterom · 2. etasje · 8 plasser · symbol `users` · blå · direkte booking
2. Fjorden — Møterom · 1. etasje · 4 plasser · symbol `monitor` · teal · direkte
3. Skogen — Stillerom · 2. etasje · 1 plass · symbol `door-closed` · grønn · direkte
4. Lysgården — Stort møterom · 1. etasje · 14 plasser · symbol `presentation` · lilla · **krever godkjenning**
Equipment:
5. Projektor Epson — Utstyr · Resepsjonen · symbol `projector` · oransje · direkte
6. Kamera Sony A7 — Utstyr · Skap B · symbol `camera` · rosa · **krever godkjenning**
7. Podkast-sett — Utstyr · Studio · symbol `mic` · gul · **krever godkjenning**
8. Whiteboard på hjul — Utstyr · 2. etasje · symbol `pen-line` · grå · direkte
Archived (admin only): Gammel projektor (arkivert 2. okt. 2026).

Short descriptions: Fjellet: "Lyst møterom med skjerm og videokonferanse." Lysgården: "Vårt største rom. Egnet for kurs og allmøter." Podkast-sett: "To mikrofoner, mikser og opptaker. Hentes i studio."

## Sample bookings (status · resource · who · time · purpose)
- Bekreftet · Fjellet · Ingrid · i dag 10:00–11:00 · "Kundemøte Nordlys"
- Venter · Podkast-sett · Ingrid · ons. 21. okt. 13:00–15:00 · "Episode 12"
- Bekreftet · Fjorden · Jonas · i dag 09:00–09:30 · "Standup"
- Bekreftet · Fjellet · Magnus · i dag 13:00–14:30 · "Styremøte"
- Venter · Lysgården · Jonas · tor. 22. okt. 09:00–12:00 · "Workshop med Fjordkraft"
- Venter · Kamera Sony A7 · Magnus · fre. 23. okt. 08:30–10:30 · "Produktbilder" (own request: Magnus cannot process it)
- Venter · Lysgården · Jonas · man. 19. okt. 08:00–09:00 · "Morgenmøte" → **Utløpt** (start has passed; reject only)
- Avslått · Kamera Sony A7 · Ingrid · fre. 16. okt. 12:00–14:00 · begrunnelse: "Kameraet er på service denne uken."
- Avbestilt · Skogen · Ingrid · tor. 15. okt. 14:00–15:00
- Bekreftet · Projektor Epson · Sofie · tir. 20. okt. 15:00–17:00 · "Kurs"

## Activity sample
- 09:05 · Magnus Berg godkjente booking B-1042 (Lysgården, Jonas Dahl)
- 08:41 · Ingrid Haugen opprettet booking B-1047 (Podkast-sett) — venter på godkjenning
- fre. 16. okt. 11:20 · Sofie Lund avslo booking B-1031 (Kamera Sony A7, Ingrid Haugen): "Kameraet er på service denne uken."
- tor. 15. okt. 09:02 · Ingrid Haugen avbestilte booking B-1029 (Skogen)
- ons. 14. okt. · Magnus Berg endret ressurs Fjorden (plasser 6 → 4)

## Admin dashboard numbers (next 7 days)
Bekreftede bookinger: 14 · Ventende godkjenninger: 3 (+ 1 utløpt) · Mest booket: Fjellet 6, Fjorden 4, Projektor Epson 2.
Chart "Bookinger neste 7 dager" per day (bekreftet/venter): man 3/0, tir 2/1, ons 3/1, tor 2/1, fre 2/0, lør 1/0, søn 1/0.

## Navigation labels
Member: Hjem · Ressurser · Kalender · Mine bookinger · Aktivitet
Admin adds (own nav section "Administrasjon"): Godkjenninger (badge with approvable count) · Ressursadministrasjon
Global: wordmark "FELLES" + small "Demo" pill (title "Syntetiske demodata") · user block "Ingrid Haugen — Medlem" · "Logg ut".
Mobile bottom tabs: Hjem · Ressurser · Kalender · Bookinger · Mer (Mer opens a sheet with the remaining items; admin's Mer shows a count dot when approvals wait).

## Microcopy rules (voice)
- Address the user as "du". Short declarative sentences. Verbs on buttons: Book, Send forespørsel, Avbestill booking, Godkjenn, Avslå, Arkiver, Lagre, Avbryt, Behold.
- Status labels (badge text): Bekreftet · Venter · Avslått · Avbestilt · Utløpt.
- Dates nb-NO: "man. 19. okt.", "i dag", "i morgen"; times "10:00–11:00" (en dash); durations "1 t 30 min".
- Errors say what happened and what to do: "Tidsrommet er ikke lenger ledig. Velg et annet tidspunkt."
- Empty states: one sentence + one action. "Ingen kommende bookinger." → "Finn en ressurs".
- Success toasts: "Bookingen er bekreftet." · "Forespørselen er sendt til godkjenning." · "Bookingen er avbestilt." · "Forespørselen er godkjent." · "Forespørselen er avslått."
- Confirmations: "Avbestille bookingen?" body names resource + time; buttons [Behold] [Avbestill booking].
