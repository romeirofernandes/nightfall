# Nightfall website

React 19 + Vite + Tailwind 4. The selected After Hours design is served at `/` and `/after-hours/`.
The two discarded directions and chooser have been removed.

```sh
cd website
npm ci
npm run dev
```

On Vercel select **website** as Root Directory, **Vite** as framework,
`npm run build` as build command, and `dist` as Output Directory.
No environment variables or SPA rewrite are needed. Existing static deployments
pointing directly at `website/dist` also work with the committed build.
