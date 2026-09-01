# Real passport cover references

This directory contains the older low-resolution passport-cover thumbnails.
Passport Atlas now displays the validated high-resolution files in
`public/passports-hq` instead.

Current thumbnail source: https://www.passportindex.org/

The exact source URL and dimensions for every image are recorded in
`sources.json`. Source-site terms apply.

The older 60x90 fallback can still be refreshed with:

```shell
npm run covers:refresh:fallback
```
