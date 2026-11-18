# Nightfall website

React 19 + Vite + Tailwind 4. The landing page is served at `/` and `/after-hours/`.
The macOS first-launch guide is at `/mac-help/`.

```sh
cd website
npm ci
npm run dev
```

On Vercel select **website** as Root Directory, **Vite** as framework,
`npm run build` as build command, and `dist` as Output Directory.
No environment variables or SPA rewrite are needed. Existing static deployments
pointing directly at `website/dist` also work with the committed build.
