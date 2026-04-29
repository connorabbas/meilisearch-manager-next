# Meilisearch Manager

A Nuxt-based web UI for managing Meilisearch instances.

This project is the refactored Nuxt version of the original Vue SPA project: [connorabbas/meilisearch-manager](https://github.com/connorabbas/meilisearch-manager).

## Features

- :rocket: **Multiple instances** management
- :electric_plug: **Single instance** mode via runtime config
- :bar_chart: **Dashboard** with stats and version details
- :open_file_folder: **Indexes** listing, creation, inspection, primary key updates, and deletion
- :gear: **Index settings** full JSON viewer/editor
- :page_facing_up: **Documents** import, search (full-text, geo), sort, filter, pagination, edit, and delete flows
- :lock: **API keys** create, view, edit, copy, and delete flows
- :ballot_box_with_check: **Tasks** history with filtering, infinite scroll, and optional polling
- :iphone: **Responsive** layout
- :waning_crescent_moon: **Dark mode** support

### Screenshots

<details>
  <summary>Click to expand</summary>
  <img width="3200" height="2000" alt="Screenshot (1)" src="https://github.com/user-attachments/assets/e7ee118f-a093-4799-86f5-bb391592c286" />
  <img width="3200" height="2000" alt="Screenshot (2)" src="https://github.com/user-attachments/assets/4e1aeee1-64ea-4b1a-8f15-cba76da86ac2" />
  <img width="3200" height="2000" alt="Screenshot (3)" src="https://github.com/user-attachments/assets/85d0c0a0-20c9-41f9-a80f-3986a30e40b7" />
  <img width="3200" height="2000" alt="Screenshot (4)" src="https://github.com/user-attachments/assets/5d27b5a3-4a8d-43e5-af26-54a68bb59e65" />
  <img width="3200" height="2000" alt="Screenshot (5)" src="https://github.com/user-attachments/assets/e558a4d1-fec3-4000-8de1-870fe4a89d8e" />
  <img width="3200" height="2000" alt="Screenshot (6)" src="https://github.com/user-attachments/assets/4f8c5b94-fd58-4c7a-8e76-94a95fc33f29" />
  <img width="3200" height="2000" alt="Screenshot (7)" src="https://github.com/user-attachments/assets/77963cf7-3063-47d9-a876-a35c83866d9f" />
  <img width="3200" height="2000" alt="Screenshot (8)" src="https://github.com/user-attachments/assets/961de20f-8961-4ade-b595-5db8c6350ae0" />
  <img width="3200" height="2000" alt="Screenshot (9)" src="https://github.com/user-attachments/assets/4a238082-c8b0-4ebd-b980-d68cb88f839c" />
  <img width="3200" height="2000" alt="Screenshot (16)" src="https://github.com/user-attachments/assets/a69aa22a-a2b0-4fad-9171-e3d910abfdff" />
  <img width="3200" height="2000" alt="Screenshot (10)" src="https://github.com/user-attachments/assets/26367c1c-ea06-4351-8422-53d4e5d3d429" />
  <img width="3200" height="2000" alt="Screenshot (11)" src="https://github.com/user-attachments/assets/4ea66a44-30d8-4dc7-aff9-e8a04f4df075" />
  <img width="3200" height="2000" alt="Screenshot (17)" src="https://github.com/user-attachments/assets/4573d21e-fb3f-4d02-8400-855e4154cd27" />
  <img width="3200" height="2000" alt="Screenshot (13)" src="https://github.com/user-attachments/assets/ae02b6e8-e29e-4927-8e23-a4a73785c212" />
  <img width="3200" height="2000" alt="Screenshot (14)" src="https://github.com/user-attachments/assets/4a6dc8f6-da68-411f-81f1-8d721c78e8ac" />
  <img width="3200" height="2000" alt="Screenshot (15)" src="https://github.com/user-attachments/assets/d2c09df3-75dc-49d3-a8d0-1488ddbbd69d" />

  Light mode is also supported:  
  <img width="3200" height="2000" alt="Screenshot (18)" src="https://github.com/user-attachments/assets/575606e3-1957-4a42-94cd-e2a0b2a0f1f9" />

</details>

## Getting Started

### Demo

Check out the live demo (hosted with GitHub pages): [https://connorabbas.github.io/meilisearch-manager-next/](https://connorabbas.github.io/meilisearch-manager-next/)

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
