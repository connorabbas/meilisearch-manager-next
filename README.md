# Meilisearch Manager Pro

A Nuxt-based web UI for managing Meilisearch instances.

This project is the refactored Nuxt version of the original Vue SPA project: [connorabbas/meilisearch-manager](https://github.com/connorabbas/meilisearch-manager).

> [!WARNING]
> This project is still a work in progress as it moves toward a `v1.0.0` release.

## Features

- :rocket: **Multiple instances** management
- :electric_plug: **Single instance** mode via runtime config
- :bar_chart: **Dashboard** with stats and version details
- :open_file_folder: **Indexes** listing, creation, inspection, primary key updates, and deletion
- :gear: **Index settings** full JSON viewer/editor
- :page_facing_up: **Documents** import, search, sort, filter, pagination, edit, and delete flows
- :lock: **API keys** create, view, edit, copy, and delete flows
- :ballot_box_with_check: **Tasks** history with filtering, infinite scroll, and optional polling
- :iphone: **Responsive** layout
- :waning_crescent_moon: **Dark mode** support

## Getting Started

### Prerequisites

- Node.js 22+
- A running Meilisearch instance

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Other scripts

```bash
npm run build
npm run preview
npm run generate
npm run lint
npm run typecheck
```

## Configuration

By default, the app supports saving and switching between multiple Meilisearch instances in browser storage.

If you only need to manage one instance, you can configure single-instance mode with public runtime config values:

```env
NUXT_PUBLIC_MEILISEARCH_HOST=https://your-instance-domain.com
NUXT_PUBLIC_MEILISEARCH_API_KEY=yourInstanceKey
```

> [!CAUTION]
>
> **Security Warning**
>
> These public runtime values are exposed to the client application. If you use an admin API key here, it will be available in the built frontend. Only use single-instance mode when access to the app is otherwise restricted, such as behind authentication or within a trusted internal network.

## Tech Stack

- [Nuxt 4](https://nuxt.com/)
- [Vue 3](https://vuejs.org/) with Composition API and [TypeScript](https://www.typescriptlang.org/)
- [PrimeVue](https://primevue.org/)
- [Pinia](https://pinia.vuejs.org/) via [`@pinia/nuxt`](https://nuxt.com/modules/pinia)
- [VueUse](https://vueuse.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`@nuxt/fonts`](https://nuxt.com/modules/fonts)
- [Lucide Vue](https://lucide.dev/)
- [Meilisearch JavaScript/TypeScript client](https://github.com/meilisearch/meilisearch-js)
- [Zod](https://zod.dev/)

## Notes

- This Nuxt app currently runs with `ssr: false`, so it behaves as a client-rendered dashboard.
- Connecting to a Meilisearch instance from the browser may require that instance to expose the appropriate CORS headers for your app domain.
