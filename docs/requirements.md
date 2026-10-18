# FELLES – Kravspesifikasjon v1.0

**Prosjekt:** FELLES – booking av felles rom og utstyr  
**Dokumentstatus:** Testkandidat, godkjenningsklar  
**Dato:** 18. oktober 2026  
**Språk:** Norsk (bokmål) i grensesnittet  
**Formål:** Bygge en liten, fullstendig fungerende webapplikasjon og samtidig teste en agentbasert utviklingsprosess med krav → slices → oppgaver → agenter → verifikasjon.

> **Viktig skille:** Del A er produktkravene, altså *hva* som skal bygges. Del B er et foreslått utviklings- og evalueringsoppsett, altså *hvordan* vi skal teste vår agentplattform. Agentene kan forbedre arbeidsplanen, men ikke endre produktkrav uten en registrert beslutning.

---

# Del A – Produktkrav

## 1. Sammendrag og mål

FELLES er en responsiv webapp der medlemmer i et lite kontorfellesskap kan finne, booke og administrere delte ressurser: møterom, arbeidsrom og utstyr. Enkelte ressurser kan bookes direkte, mens andre krever godkjenning fra en administrator. Appen skal vise kalender, tilgjengelighet, kommende bookinger, historikk og et oversiktlig administrasjonspanel.

Den skal oppleves som et lite, gjennomført produkt – ikke som en teknisk demonstrasjon med tomme sider. Data og hendelser skal være reelle i den lokale databasen. Forhåndsutfylte demodata skal være tydelig merket som syntetiske.

**Målgruppe:** Et kontorfellesskap med 5–30 medlemmer. **Driftsform:** Lokal demo på én Mac, uten eksterne skytjenester. **Ambisjonsnivå:** En avgrenset MVP som normalt bør kunne gjennomføres i løpet av timer til noen få dager med kodeagenter, avhengig av test- og integrasjonsarbeid. Ingen garanti for tidsbruk.

## 2. Brukerroller og terminologi

- **Medlem:** Kan se aktive ressurser, egen bookinghistorikk, tilgjengelighet, opprette og avbestille egne fremtidige bookinger.
- **Administrator:** Har alle medlemsrettigheter og kan i tillegg opprette/redigere/arkivere ressurser, godkjenne/avslå forespørsler og se organisasjonens booking- og aktivitetsoversikt.
- **Ressurs:** Ett konkret rom eller én konkret utstyrsenhet. Hver ressurs kan bare reserveres av én booking om gangen.
- **Booking:** En tidsavgrenset reservasjon av én ressurs til én bruker.
- **Godkjenningsplikt:** Når aktivert på en ressurs, opprettes bookinger med status `pending` og blokkerer tidsrommet inntil de godkjennes, avslås eller avbestilles.

### Statusmodell

`pending` → `confirmed` eller `rejected` eller `cancelled`  
`confirmed` → `cancelled`  
`rejected` og `cancelled` er sluttstatuser. Bookinger slettes aldri fra historikken. `pending` og `confirmed` blokkerer kapasitet. `rejected` og `cancelled` gjør det ikke.

En administrator kan ikke godkjenne eller avslå sin **egen** godkjenningspliktige booking. I demodata finnes minst to administratorer slik at dette kan testes.

## 3. Funksjonelle krav

### 3.1 Brukere og tilgang

| ID | Prioritet | Krav og akseptansekriterium |
|---|---|---|
| AUT-01 | MUST | Brukeren kan logge inn med e-post og passord. Gyldig innlogging gir sesjon; ugyldig gir tydelig feil uten å avsløre om e-post finnes. |
| AUT-02 | MUST | Beskyttede API-kall krever aktiv sesjon. Avlogging avslutter sesjonen. |
| AUT-03 | MUST | Medlem og administrator har forskjellige rettigheter som håndheves på serveren, ikke bare i UI. Medlem kan ikke endre ressurser eller behandle andres forespørsler. |
| AUT-04 | MUST | Brukergrensesnittet viser innlogget navn og rolle. Sesjoner skal fungere etter vanlig sideoppfriskning. |

### 3.2 Ressurskatalog

| ID | Prioritet | Krav og akseptansekriterium |
|---|---|---|
| RES-01 | MUST | Alle innloggede brukere kan se og søke i aktive ressurser, filtrere på `room` / `equipment`, og åpne en detaljside. |
| RES-02 | MUST | En ressurs har ID, navn, kategori, kort beskrivelse, plassering, eventuelt antall sitteplasser, symbol/farge, flagget `approvalRequired` og aktiv/arkivert status. |
| RES-03 | MUST | Administrator kan opprette og redigere ressurser. Ugyldige verdier avvises med feltspesifikke feilmeldinger. |
| RES-04 | MUST | Administrator kan arkivere en ressurs som ikke har fremtidige aktive bookinger. Arkivert ressurs kan ikke bookes og vises ikke i vanlig katalog. |
| RES-05 | SHOULD | Ressurslisten har en tydelig indikator for om en ressurs krever godkjenning. |

### 3.3 Booking og konfliktkontroll

| ID | Prioritet | Krav og akseptansekriterium |
|---|---|---|
| BOK-01 | MUST | Medlem kan velge ressurs, dato, start, slutt og kort formål og opprette en booking. |
| BOK-02 | MUST | Tillatte tider er **08:00–22:00** norsk lokal tid. Start og slutt må ligge på hel eller halv time. Varighet er minst 30 minutter og høyst fire timer. Slutt må være etter start, og bookingen kan ikke starte i fortiden eller mer enn 30 døgn frem i tid. |
| BOK-03 | MUST | To bookinger på samme ressurs kan ikke ha overlappende intervaller dersom begge er `pending` eller `confirmed`. Testkontrakten er `startA < endB && startB < endA`. Booking 10:00–11:00 og 11:00–12:00 er derfor tillatt. |
| BOK-04 | MUST | Konfliktkontrollen er **atomisk på serveren**: To samtidige forespørsler om samme tidsrom skal maksimalt gi én vellykket booking, uten delvis skrevne data. |
| BOK-05 | MUST | Ressurs uten godkjenningsplikt gir `confirmed` umiddelbart. Ressurs med godkjenningsplikt gir `pending`, og det aktuelle tidsrommet blir blokkert. |
| BOK-06 | MUST | Bookingens eier kan avbestille sin egen `pending` eller `confirmed` booking før start. Administrator kan avbestille andres bookinger før start og må da oppgi begrunnelse. Avbestilling gjør tidsrommet ledig og registreres i historikken. |
| BOK-07 | MUST | Bookingform viser tilgjengelighet og gir forståelig respons ved konflikt, valideringsfeil og vellykket booking. Serveren er alltid fasit, selv om UI viser ledig tid. |
| BOK-08 | SHOULD | Brukeren kan enkelt booke en ressurs på nytt fra tidligere booking med nytt tidspunkt. |

### 3.4 Godkjenning

| ID | Prioritet | Krav og akseptansekriterium |
|---|---|---|
| APP-01 | MUST | Administrator har en liste over ventende godkjenninger med ressurs, søker, tidsrom og formål. |
| APP-02 | MUST | Administrator kan godkjenne eller avslå en annens forespørsel. Avslag krever en kort begrunnelse; godkjenning registrerer administrator og tidspunkt. |
| APP-03 | MUST | Kun en booking som fortsatt er `pending` kan behandles. Gjentatt eller samtidig godkjenning skal ikke gi dobbeltbehandling. Serveren validerer at ressursen fremdeles er aktiv og tidsrommet gyldig. |
| APP-04 | MUST | Ved avslag blir tidsrommet straks ledig. Medlem ser egen oppdaterte status og avslagsbegrunnelse. |

### 3.5 Kalender, oversikt og aktivitet

| ID | Prioritet | Krav og akseptansekriterium |
|---|---|---|
| VIS-01 | MUST | En ukevisning viser bookinger for valgt ressurs med tydelige tidsblokker og status. Brukeren kan navigere mellom uker og filtrere på ressurs. |
| VIS-02 | MUST | Brukeren ser `Mine bookinger`, sortert med kommende først, og kan åpne detaljer eller avbestille når reglene tillater det. |
| VIS-03 | MUST | En startside viser kommende bookinger og ressurser. Administrator ser også antall ventende godkjenninger. |
| VIS-04 | MUST | Administrator har et oversiktspanel for de neste syv døgnene: totalt antall `confirmed` bookinger, ventende godkjenninger og de tre mest bookede ressursene (målt i antall bekreftede bookinger). |
| VIS-05 | MUST | En aktivitetslogg registrerer opprettelse, godkjenning, avslag, avbestilling og ressursendringer med aktør, tidspunkt og relevant ID. Medlem ser aktivitet for egne bookinger; administrator ser alt. |
| VIS-06 | SHOULD | Visuell fremstilling (f.eks. søylediagram) av bookingaktivitet, med tilgjengelig tekstlig alternativ. |

## 4. Felles forretningsregler

- Tidspunkt lagres som UTC i databasen og vises i tidssonen `Europe/Oslo`. Bookingvinduet 08–22 gjelder lokal tid. Sommertid skal håndteres korrekt; test minst ett datointervall rundt skiftet mellom sommer- og vintertid.
- Ressurser må være aktive ved opprettelse og godkjenning. Ingen hard sletting av ressurser med bookinghistorikk.
- Bookinger endres ikke ved å overskrive tidsrommet. Brukeren avbestiller og oppretter ny booking.
- Samtlige mutasjoner valideres på serveren og returnerer forståelige, strukturerte feilsvar.
- Audit-hendelsen og selve dataendringen må lagres i samme databasetransaksjon.
- Forespørsler fra ikke-innloggede skal ikke kunne lese booking- eller brukerdata.

## 5. Brukergrensesnitt og design

Designmålet er en visuelt gjennomført, rolig og moderne webapp. Ikke kopier et bestemt kommersielt produkt. Bruk et konsekvent typografisk hierarki, luft, god kontrast, velvalgte ikoner, tydelige tomtilstander, responsiv layout og nøktern animasjon. Unngå at mange tabeller gjør løsningen tung å lese.

**Minimumssider:** (1) Innlogging, (2) Dashboard, (3) Ressurser + ressursdetaljer, (4) Kalender, (5) Mine bookinger, (6) Godkjenninger for administrator, (7) Ressursadministrasjon for administrator, (8) Aktivitet. Navigasjon og rollebasert synlighet må fungere på mobil og desktop.

- Skjermbredder: minst 375 px og 1440 px uten horisontal scrolling.
- Universell utforming: tastaturnavigasjon, synlige fokusmarkeringer, semantiske skjemaetiketter, feilmeldinger som kan forstås uten bare farge, og god kontrast. Mål WCAG 2.2 AA der det er praktisk i MVP-en.
- Tydelige tilstander: laster, tomt, feil, utilgjengelig, suksess og bekreftelse før destruktiv handling.
- Grensesnittet er på norsk. Dato, tid og tall følger norsk lokalformatering.

## 6. Teknisk avgrensning

Dette er en anbefalt, enkel referansestack. Den kan endres av utviklingsagenten ved eksplisitt begrunnelse før implementasjon, men ikke midt i et parallelt arbeid uten registrert kontraktbeslutning.

| Del | Referansevalg |
|---|---|
| Frontend | React + TypeScript + Vite |
| API | Node.js + TypeScript + Fastify |
| Validering og kontrakter | Zod, delte DTO-er i `packages/contracts` |
| Database | SQLite (`better-sqlite3`), med migrasjoner |
| UI | CSS-variabler + valgfritt Tailwind, ingen ekstern UI-tjeneste |
| Tester | Vitest for domene/API, Playwright for E2E |
| Repo | npm workspaces: `apps/web`, `apps/api`, `packages/contracts` |

Applikasjonen skal starte med én dokumentert kommando etter installasjon av avhengigheter og database-seeding. API og web kjører lokalt. Integrasjonstester bruker isolerte, midlertidige databaser, aldri utviklingsdatabasen. Ingen hemmelige nøkler commits til Git.

### Kontrakter som må fastsettes før parallell utvikling

- Datastrukturer for `User`, `Resource`, `Booking`, `ActivityEvent`, med entydige ID-er og statusverdier.
- API: `/api/session` (les/inn/ut), `/api/resources` (liste/opprett/endre), `/api/bookings` (liste/opprett), `/api/bookings/:id/{cancel,approve,reject}`, `/api/dashboard`, `/api/activity`.
- Standardformat for feil: maskinlesbar kode, menneskelesbar melding og eventuelle feltfeil.
- Rolle- og autorisasjonsregler; håndtering av UTC og lokal tid.

## 7. Demo og seed-data

Seed minst **8 ressurser**: fire rom og fire utstyrsenheter, hvorav minst to krever godkjenning. Seed minst **4 brukere**: to administratorer og to medlemmer. Seed minst **18 syntetiske bookinger** med variasjon i tid og status og aktivitet knyttet til dem. Demo-dataene bør legges rundt inneværende uke, med en injiserbar klokke slik at automatiske tester er deterministiske. Demo-kontoer og passord dokumenteres kun som utviklingslegitimasjon, med hash-lagrede passord i databasen.

Et valgfritt `npm run demo:reset` kan gjenopprette syntetiske data, men må advare tydelig før eksisterende lokal demodata erstattes.

## 8. Ikke-funksjonelle krav

| ID | Prioritet | Krav og akseptansekriterium |
|---|---|---|
| NFR-01 | MUST | Full løsning kan kjøres lokalt på macOS med dokumentert oppsett og uten betalte tjenester eller eksterne API-nøkler. |
| NFR-02 | MUST | TypeScript typecheck, lint, automatiske tester og produksjonsbuild kjøres uten feil før integrasjon. |
| NFR-03 | MUST | Testene dekker særlig kollisjoner, samtidig booking, rollebegrensning, statusoverganger, transaksjonsintegritet og UTC/lokal tid. |
| NFR-04 | MUST | API-et bruker parameteriserte databaseoperasjoner, hash-lagrede passord, HTTP-only sesjonscookie og serverstyrt tilgangskontroll. Sesjonscookie har `SameSite=Lax` eller strengere, og `Secure` ved HTTPS. Skrivende kall beskyttes mot CSRF ved kontroll av `Origin` (med egnet tillegg dersom arkitekturen krever det). |
| NFR-05 | MUST | En ny utvikler/agent kan starte prosjektet fra README uten å trenge tidligere chatkontekst. |
| NFR-06 | SHOULD | Typiske API-oppslag føles responsive på lokale demodata; ingen formell lasttest eller produksjons-SLA kreves. |

## 9. Klart utenfor omfang

Ingen betaling, e-post/SMS-varsling, kalenderintegrasjon med Google/Microsoft, AI-funksjon i selve appen, opplasting av bilder/filer, multi-tenant drift, mobilapp, produksjonsdeploy, avansert søk, gjentakende bookinger eller fysisk adgangskontroll. In-app statusmeldinger er tilstrekkelig.

## 10. Akseptansescenarier – obligatoriske E2E-bevis

| ID | Scenario | Forventet resultat |
|---|---|---|
| E2E-01 | Medlem logger inn, finner rom, booker ledig tidsrom | Booking er `confirmed`, vises i kalender og under Mine bookinger. |
| E2E-02 | Medlem prøver å booke et overlappende tidsrom | Konflikten avvises; eksisterende booking er uendret. |
| E2E-03 | To forespørsler reserverer samme ressurs samtidig | Nøyaktig én lykkes. Ingen duplisering eller foreldreløs aktivitet. |
| E2E-04 | Medlem booker godkjenningspliktig utstyr; annen administrator godkjenner | Først `pending`, deretter `confirmed`, og tidsrommet forblir blokkert. |
| E2E-05 | Administrator avslår en forespørsel med begrunnelse | Booking blir `rejected`; medlem ser begrunnelse og tidsrommet er frigitt. |
| E2E-06 | Medlem avbestiller fremtidig booking | Status blir `cancelled`, historikken bevares, tidsrommet blir ledig. |
| E2E-07 | Medlem forsøker å kalle administrator-API direkte | Serveren returnerer 403 og ingen endring utføres. |
| E2E-08 | Administrator oppretter og arkiverer en ressurs | Katalogen oppdateres; arkivert ressurs kan ikke bookes. Arkivering med fremtidig aktiv booking avvises. |
| E2E-09 | Admin forsøker å godkjenne egen booking | Serveren avviser handlingen, status er uendret. |
| E2E-10 | Bruker navigerer med tastatur på mobilbredde | Kritiske handlinger er tilgjengelige, skjemafeil lesbare, ingen horisontal scrolling. |

**Definisjon av ferdig:** Alle MUST-krav oppfylt; alle obligatoriske E2E-scenarier grønne; dokumentert lokal start; ingen kjente alvorlige feil; funksjonaliteten demonstreres mot den virkelige SQLite-databasen, ikke hardkodede frontend-responser. SHOULD-krav som ikke er levert oppføres eksplisitt som restarbeid.

---

# Del B – Forslag til gjennomføring i vårt agentbaserte testoppsett

Denne delen er en **startplan**, ikke autoritativ produktlogikk. Den må kunne forbedres av planleggeragenten og skal bevisst gi oss nok uavhengige arbeidsoppgaver til å teste to eller tre samtidige agenter.

## 11. Foreslåtte slices

| Slice | Leveranse | Viktigste avhengighet | Typiske oppgaver |
|---|---|---|---|
| S00 | Prosjektfundament: repo, schema, migrasjoner, felles kontrakter, seed, scripts, CI-gate | Ingen | T00-01 scaffold; T00-02 datamodell/kontrakter; T00-03 testharness/seed |
| S01 | Autentisering og roller | S00 | T01-01 session API; T01-02 rollepolicy/test; T01-03 innloggings-UI |
| S02 | Ressurskatalog og admin | S00 | T02-01 ressurs-API; T02-02 katalog/filterside; T02-03 ressursadministrasjon |
| S03 | Bookingmotor og konfliktkontroll | S00, S01, S02 | T03-01 domene/validering; T03-02 atomisk konfliktkontroll; T03-03 booking-API og tester |
| S04 | Bookinggrensesnitt og kalender | S03 | T04-01 skjema og status; T04-02 ukevisning; T04-03 Mine bookinger |
| S05 | Godkjenning og avbestilling | S03 | T05-01 tilstandsoverganger/API; T05-02 admin-kø; T05-03 status/avbestilling i UI |
| S06 | Aktivitet og oversiktsdashboard | S03 | T06-01 aktivitetslogg; T06-02 aggregater; T06-03 dashboard/visualisering |
| S07 | Integrasjon, UX, sikkerhet og sluttverifikasjon | S04, S05, S06 | T07-01 full E2E; T07-02 tilgjengelighet/responsivitet; T07-03 dokumentasjon og demo |

### Mulig parallell plan

- Etter S00 kan **S01 og S02** bygges parallelt når datamodellen og kontraktene er frosset.
- S03 starter når S01 og S02 er integrert og verifisert.
- Etter S03 kan **S04, S05 og S06** i prinsippet bygges parallelt dersom de arbeider i klart atskilte moduler og bruker samme publiserte API-kontrakter.
- S07 integrerer sluttresultatet. Ved delte filer, databasemigrasjoner eller kontraktendringer må arbeidet serialiseres eller koordineres; Git-worktrees alene er ikke nok.

**Arbeidsenheten er en task, ikke en slice.** Hver task skal ha stabil ID, mål, kravreferanser, avhengigheter, fil-/modulansvar, akseptansekriterier, testkommandoer og en ferdig-definisjon. Den konkrete agentprompten genereres fra disse feltene og relevant repository-kontekst.

## 12. Regler for agentkjøringen

1. **Planlegg før implementasjon.** Les spesifikasjonen; bygg et kravregister; foreslå slices, tasks og avhengighetsgraf; pek på uklarheter. Ikke start kode før S00-kontrakter og plan er kontrollert.
2. **Én oppgave = én eier av gangen.** Bruk atomisk reservasjon i oppgaveoversikten. Separate branches/worktrees for samtidige skriveoppgaver.
3. **Én kilde for levende status.** Status lagres strukturert; Kanban er en visning, ikke enda et uavhengig statusregister. Git er fasit for kode, tester for verifikasjonsbevis.
4. **Begrens parallellitet.** Start med én agent, deretter maksimalt to agenter, og først senere tre dersom integrasjonskostnaden er håndterbar. Hver agent har avgrenset filansvar.
5. **Beskytt delte kontrakter.** Endringer i `packages/contracts`, database-skjema, felles CSS/layout eller konfigurasjon må godkjennes før parallelle oppgaver fortsetter.
6. **Ingen falsk ferdigmelding.** `task completed`, `slice implemented`, `tests verified` og `accepted` er forskjellige tilstander. Alle testbevis må være knyttet til commit og konkret testkjøring.
7. **Ingen automatisk produksjonsdeploy.** Demoen kjører lokalt. Ikke bruk betalte API-er eller opprett eksterne ressurser uten uttrykkelig godkjenning.
8. **Ved feil:** Agenten rapporterer faktisk blokkering med logg. Oppgaven kan tildeles ny agent uten å miste hendelseshistorikk.

## 13. Akseptansetester for selve orkestreringsoppsettet

Dette er ikke FELLES-produktkrav, men **målekriteriene for eksperimentet**.

| ID | Vi vil bevise | Observasjon som teller |
|---|---|---|
| ORK-01 | Krav → slices → tasks er sporbart | Hvert MUST-krav har minst én ansvarlig slice og ett verifiserbart testbevis. |
| ORK-02 | Avhengigheter styrer rekkefølgen | S03 kan ikke starte før S01 og S02 er godkjent ferdig. |
| ORK-03 | To agenter kan arbeide parallelt | S01 og S02 gjennomføres i egne worktrees uten delt filkonflikt. |
| ORK-04 | Sanntidsovervåking er nyttig | Brettet viser agentstatus, aktiv task, siste hendelse, blocker, testresultat og branch. |
| ORK-05 | Avbrutt arbeid kan gjenopptas | Avslutt én sesjon kontrollert midt i en task; ny sesjon fortsetter fra repository, status og logg. |
| ORK-06 | Testfeil hindrer falsk fullføring | Injiser/observer en reell testfeil; oppgaven forblir ikke `verified`. |
| ORK-07 | Kvalitetssikring før integrasjon | Endring gjennomgås, tester kjøres på riktig commit, først deretter merge. |
| ORK-08 | Det er mulig å forstå historikken | For et ferdig MUST-krav kan vi åpne krav → slice → task → agentkjøring → commit → testbevis. |
| ORK-09 | Ressursforbruk er synlig | Registrer minst tid, antall agentkjøringer og eventuelt tilgjengelig token-/kostnadsestimat; vis `ukjent` hvis kostnad ikke kan måles. |
| ORK-10 | Integrasjon er deterministisk | Samtidige deloppgaver merges først når felles integrasjonstester er grønne. |

## 14. Foreslått rekkefølge for piloten

**Fase A – Planlegging:** Én hovedagent analyserer dokumentet, oppretter sporbar kravliste, slice-kort og task-kort, og vurderer avhengighetene. Mennesket godkjenner første plan.

**Fase B – Første fungerende gjennomskjæring:** S00, S01, S02 og S03 gir autentisering, ressurskatalog og reell booking med konfliktkontroll. Kjør E2E-01 til E2E-03 og E2E-07 tidlig.

**Fase C – Parallell demonstrasjon:** S04, S05 og S06 fordeles når S03 er grønn og felles kontrakter er stabile.

**Fase D – Ferdigstillelse:** S07 samler arbeid, gjennomfører alle obligatoriske testscenarier, dokumenterer restarbeid og demonstrerer et komplett produkt.

**Pilotens endelige suksesskriterium:** Vi kan ikke bare vise en fungerende bookingapp. Vi må også kunne forklare, på skjermen, *hvorfor* hver oppgave ble valgt, *hvem* som arbeidet med den, *hva* som ble endret, *hvilke tester* som beviser funksjonaliteten og *når* oppgaven ble ansett som ferdig.

---

## 15. Beslutningslogg / åpne spørsmål

Ingen åpne spørsmål trenger blokkere planlegging. Disse standardvalgene gjelder inntil de eventuelt endres eksplisitt:

- Lokal én-organisasjonsdemo; ingen produksjonsdrift.
- Medlem/admin med separate serverstyrte tillatelser.
- Bookingvinduer er lokale 08:00–22:00, 30-minutters trinn, maks fire timer, maks 30 døgn frem.
- Ventende godkjenning blokkerer kapasitet.
- Ingen eksterne varsler eller tjenester.
- Krav med MUST er obligatoriske; SHOULD kan utsettes og skal føres som restarbeid.

**Slutt på kravspesifikasjonen.**
