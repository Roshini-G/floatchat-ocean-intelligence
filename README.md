# FloatChat

A multimodal AI interface for exploring ARGO oceanographic data using natural-language queries, map interaction and visual controls. All data is synthetic **DEMO ARGO DATA**, generated locally so the app runs fully offline with no external API dependency.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Launch Explorer**.

## Try it

On the Explorer page, type a query or click an example, e.g.:

> Show temperature and salinity profiles for ARGO floats in the Arabian Sea during the last 30 days.

This interprets the query into a region, time window, depth range and parameter; filters the demo ARGO float dataset; runs QC filtering, thermocline detection and salinity-gradient analysis; and renders the results as a map, depth profile charts, a rotatable 4D (lon/lat/depth/time) trajectory view, and a natural-language summary.

## Structure

- `src/data` — synthetic ARGO float dataset (floats, cycles, depth profiles) and region definitions
- `src/services` — natural-language query parsing and float filtering
- `src/analysis` — QC filtering, thermocline/halocline detection, insight generation
- `src/components/landing` — landing page UI
- `src/components/explorer` — map, depth charts, 3D trajectory view, filters, insights panel
- `src/app` — Next.js routes (`/` landing, `/explorer` app)
