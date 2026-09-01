# High-resolution passport cover references

This directory contains the passport-cover images displayed by Passport Atlas.
Every file is validated by the importer to be at least 600x850 pixels.

- China uses a 960x1344 public-domain rendering from Wikimedia Commons.
- Other covers use the full-size country images publicly displayed by Passport Index.
- Exact source URLs, dimensions, and source terms are recorded in `sources.json`.

Passport designs may vary by issue year and document type. These images are
visual references, not official identity-document reproductions.

After exporting the full-size source images with the browser asset workflow,
import and validate the full image set with:

```shell
npm run covers:refresh:hq
```
