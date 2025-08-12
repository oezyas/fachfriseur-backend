# Fachfriseur Backend
[![CI](https://github.com/oezyas/fachfriseur-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/oezyas/fachfriseur-backend/actions/workflows/ci.yml)

**Bug melden:** https://github.com/oezyas/fachfriseur-backend/issues/new

Node.js/Express + MongoDB. Enthält Auth (JWT + Cookies), Produkt-CRUD (mit Upload), Passwort-Reset (Request/Confirm), Logging (Winston-Rotation), Helmet/CSP, Rate-Limiter.

## Setup
```bash
npm i
cp .env.example .env
npm run dev
```