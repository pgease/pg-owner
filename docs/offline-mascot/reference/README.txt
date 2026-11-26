Reference implementation for the PG Ease offline screen (not production code, copy/adapt).
offline.html   - fully self-contained (logo + mascot inlined as base64, no network requests). Set window.PGEASE_APP_URL / PGEASE_PING_URL before the script, or edit go()/retry().
fonts/         - Poppins (OFL) used by offline.html via @font-face
assets/        - mascot (offline/empty/error) 512 png+webp, full logo, icon
Full-size PNG/WebP sets are in ../png and ../webp
