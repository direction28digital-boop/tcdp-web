# tcdp-web

The public site for **The CrAZy Dog People** (audience-facing name: **AZ Pound Pups**), at
thecrazydogpeople.com.

Next.js 16 · TypeScript · Tailwind 4 · deployed on Vercel.

## What it does

Shows every dog currently on the Maricopa County Animal Care and Control priority list,
with their real deadline, and routes people to the application.

- `/` homepage
- `/dogs` searchable list of every active priority dog
- `/dogs/[id]` a public page per dog
- `/team` placeholder for the volunteer dashboard

## Where the data comes from

The [foster-portal-importer](https://github.com/direction28digital-boop/foster-portal-importer)
scrapes the MCACC Priority Placement Portal hourly and commits the result to GitHub. This site
reads `data/priority-dogs.json` from that repo with a 30 minute revalidate, so pages refresh
themselves without a deploy.

`src/data/snapshot.json` is a committed fallback. If GitHub is unreachable the site renders the
snapshot rather than an empty list.

### The rule about staff notes

The importer's `sections` field holds raw shelter memos, behavior evaluations, medical treatment
history and bite history. **That is internal only.** It is stripped in `src/lib/dogs.ts` at the
data boundary, so a public page structurally cannot render it. Do not map it into the `Dog` type.

## Dog bios

`src/data/bios.json` holds warm, human bios written from each dog's real county record. Regenerate
from the markdown source with:

```bash
npm run bios -- "path/to/AZ Pound Pups Dog Bios.md"
```

Dogs without a bio fall back to their county facts, which is honest and still useful.

## Language rules

- Never lead with the word "foster". The CTA is **"Apply to Save"**. People believe fostering
  rules out adopting; once they talk to us, they foster.
- No em dashes anywhere, in code comments or in copy.
- We are not a 501(c)(3) yet. Never imply nonprofit status or that anything is tax deductible.

## Design

Palette sampled from the TCDP logo's Arizona sunset gradient. Color semantics:

| Color | Hex | Means |
|---|---|---|
| sunset | `#c85030` | waiting, urgent |
| sage | `#3a5a51` | safe with a rescue |
| gold | `#f6c98b` | home |

Torn paper edges and paint swipes are real vectors from `brand/` in the importer repo, inlined in
`src/lib/shapes.ts`. Accessibility target is WCAG 2.1 AA; every text pair in the palette has been
contrast checked.

## Local development

```bash
npm install
npm run dev
```

## Deploying

Vercel builds from `main`. No environment variables are needed: the dog feed is a public URL.
