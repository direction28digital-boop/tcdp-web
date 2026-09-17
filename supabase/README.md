# Database

The portal runs on the Supabase project **`foster-portal`** (`twsomyzkoggtuefecpew`).

## Rules

1. **Never define a table, policy or function in the Supabase dashboard.** Write
   a new numbered file in `migrations/` and apply it from there. The schema lived
   only in the dashboard from 2026-08-11 to 2026-09-11, which meant one deleted
   free-tier project would have erased all of it.
2. `0001` and `0002` are a **baseline**, reconstructed from
   `src/lib/supabase/database.types.ts` and verified column-for-column against
   production on 2026-09-11. They are **not** applied to `foster-portal`, which
   already has this schema. They exist for disaster recovery and to stand up
   SOSHub as tenant #2.
3. `0003` onwards are real, applied migrations.
4. After any change, regenerate types:
   `npx supabase gen types typescript --project-id twsomyzkoggtuefecpew > src/lib/supabase/database.types.ts`

## Live state, 2026-09-11

11 tables, RLS on all 11, 27 policies, 2 `private` schema helpers, 1 storage
bucket (`dog-videos`, private, 200 MB per file). Security advisors: one warning,
about leaked-password protection, which does not apply because this project is
magic-link only and has no passwords.

⚠️ **Free tier gives 1 GB of storage in total.** That is a handful of phone
videos, not a library. Watch it before the team starts filming in volume.
