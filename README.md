# Kapıkule Live

Een lichte, **reclamevrije** webapp (PWA) om live grenspost-camera's te bekijken
op je telefoon — in reisvolgorde op de auto-route naar Turkije:

- **Batrovci** (Kroatië ↔ Servië) — 🎥 live video (AMSS/MUP)
- **Gradina** (Servië ↔ Bulgarije) — 🎥 live video (AMSS/MUP)
- **Kapıkule** (Bulgarije ↔ Turkije) — 4 foto-camera's
- **Hamzabeyli** (Bulgarije ↔ Turkije) — foto's
- **Dereköy** (Bulgarije ↔ Turkije) — foto's
- **İpsala** & **Pazarkule** (Griekenland ↔ Turkije) — foto's

De Turkse posten zijn foto's die verversen; de Servische posten zijn échte
live-videostreams (HLS), afgespeeld met de lokaal meegeleverde `hls.js`.

## Bron

De beelden komen rechtstreeks van de officiële bron van het Turkse
Ministerie van Handel: <https://trakya.ticaret.gov.tr/yayinlar/canli-kameralar>
(gehost op `trakya.iscoz.com`). Geen reclame, geen tracking, geen tussenlaag.

De bron staat achter een **Cloudflare-beveiliging** die zowel directe hotlinks
vanuit de browser als proxies uit datacenters (zoals Vercel) blokkeert. Daarom
lopen de beelden via de gratis, gevestigde image-proxy **[wsrv.nl](https://wsrv.nl)**
(weserv), die er wél doorheen komt en de beelden met correcte CORS-headers
doorgeeft. Elke verversing krijgt een cache-buster (`?_=timestamp`) zodat je
altijd een vers beeld ziet. Laadt een beeld toch niet, dan toont de app netjes
"Beeld niet beschikbaar" met een knop om opnieuw te proberen.

De proxy wisselen? Pas `PROXY` / `ORIGIN` bovenaan `app.js` aan.

## Lokaal draaien

```bash
npx serve .        # of: python3 -m http.server 5173
```

Open daarna het adres op je telefoon (zelfde wifi) of in de browser.

## Deployen op Vercel

Dit is een statische site (geen build-stap nodig).

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # productie
```

Kies bij de eerste keer "Other" als framework; er is niets te builden.

## Op je beginscherm zetten

- **iPhone (Safari):** deel-knop → "Zet op beginscherm".
- **Android (Chrome):** menu → "App installeren" / "Toevoegen aan startscherm".

## Bestanden

| Bestand | Doel |
|---|---|
| `index.html` | App-structuur |
| `styles.css` | Vormgeving (donker, mobiel-eerst) |
| `app.js` | Camera's, verversen, fullscreen-weergave |
| `manifest.webmanifest` | PWA-manifest (installeerbaar) |
| `sw.js` | Service worker (app-shell cache; beelden nooit gecachet) |
| `vercel.json` | Hosting-config |
| `icons/` | App-iconen |

Camera's aanpassen? Bewerk de `GATES`-lijst bovenaan `app.js`.
