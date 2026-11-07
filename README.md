# Botiquín app

Next.js (App Router) + TypeScript demo of the Botiquín mascot, a Rive character
that accompanies a chatbot.

```bash
npm install
npm run dev
```

## Files

- `public/rive/botiquin.riv`: runtime export of the Rive editor file.
- `lib/mascot.ts`: contract with the Rive file (modes, handle, file path).
- `components/Mascot.tsx`: reusable component (`@rive-app/react-webgl2`).
- `components/ChatDemo.tsx`: demo chat that drives the mascot from app events.

## Using `<Mascot />`

```tsx
const mascot = useRef<MascotHandle>(null);

<Mascot ref={mascot} mode="thinking" size={240} />;

mascot.current?.success(); // one-shots: success(), error(), appear()
```

- `mode` (persistent): `idle`, `thinking`, `listening`, `working`, `warning`,
  `sleeping`.
- One-shots interrupt the current state, play once, and then the mascot goes
  back to whatever `mode` currently says (so `success()` while `working` ends
  up working again; set `mode` to `idle` first if it should rest).

## Chat events used in the demo

| Event | Mascot |
|---|---|
| User types | stays `idle` (wakes it if asleep) |
| Message sent | `thinking`, then `working` while the reply streams |
| Reply finished | `idle` |
| Message contains "error" | `error()` |
| Message contains "gracias" or "listo" | `success()` after the reply |
| Message contains "aviso" | `warning` for about 3 s |
| 30 s without activity | `sleeping` |

## Updating the mascot

Re-export the file from the Rive editor (`Export > For Runtime`) and replace
`public/rive/botiquin.riv`. Keep the view model `BotiquinVM` (enum `mode`,
triggers `appear`, `success`, `error`) and the state machine name in
`lib/mascot.ts`.

## Notes

- The Rive WebAssembly runtime is fetched from unpkg at load time. Self-host it
  for offline or strict-CSP deployments.
- The editor-side `Default` view model instance is not exported with the file,
  so the component creates a fresh instance (`useNew`).
- No reduced-motion variant yet.
