# @comwit/ui-templates

**Comwit UI's visual layer:** components that apply Tailwind tokens and `cva` variants to the [`@comwit/ui`](https://www.npmjs.com/package/@comwit/ui) headless engine.

The distribution approach is inspired by shadcn: bring component source into your project to **own and customize it**. Installation uses Comwit's own [`comwit-ui`](../cli) CLI, with no dependency on shadcn tooling.

This is a curated kit. Each role uses a suitable library: ssgoi for page transitions, sonner for toasts, overlay-kit for popups, tiptap for editing, TanStack Table for tables, react-day-picker for calendars, react-hook-form for forms, and react-virtuoso for chat virtualization. Neutral component names and shared tokens wrap these engines. Engines install as npm dependencies; wrappers become your code. Documentation cards link to each underlying library with “Built on …”.

## Installation

```bash
npx comwit-ui@latest init          # comwit.json, token wiring, and base dependencies.
npx comwit-ui@latest add button    # Component, registry dependencies, and npm dependencies.
```

- **Visual components (.tsx):** copied to your `components/ui/` with imports rewritten to your aliases. Edit them freely.
- **`@comwit/ui`:** installed from npm for behavior, accessibility, IME, focus, calendar/time, and editor logic.
- **Token contract:** `init` writes `comwit-tokens.css` and imports it into global CSS. Defaults to Comwit blue and Pretendard. Rebrand through `--brand` values; adjust corners, borders, shadows, and motion through L0 controls such as `--radius-scale`, `--border-width`, `--elevation-*`, and `--duration-*`. Dark mode uses one `.dark` class. No preset themes: consumers override tokens without editing components. See the [UI token contract](../README.md#token-contract-theming-and-customization).

See the [CLI README](../cli/README.md) for commands, flags, `comwit.json`, and installation behavior.

## Providers

`popup.confirm/alert/sheet` uses [overlay-kit](https://overlay-kit.slash.page/). Toasts use [sonner](https://sonner.emilkowal.ski/) with our glass `<Toast>`. Call `toast()` from the installed `toast.tsx`; importing Sonner's toast directly displays its default skin. Mount these once at the app root:

```tsx
'use client'
import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@/components/ui/toast' // Install the toast component too.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OverlayProvider>
      {children}
      <Toaster />
    </OverlayProvider>
  )
}
```

## Page transitions

`page-transition` adds native app-style drill, sheet, and slide motion without replacing the router. The engine is [`@ssgoi/react`](https://ssgoi.dev) (`^7.5.0-beta.2`, published under the `beta` tag), wrapped in neutral names: `PageTransition` (provider), `AppScreen` and `AppGroupLayout` (the page and group boundaries), `routeFramework` (how the engine reads your router), and `PageBoundary` (a keyed boundary for router-less demos).

`comwit-ui add page-transition` (and `add app-shell`) detects the router in `package.json` and installs a `route-boundary.tsx` variant that exports `routeFramework`: Next.js App Router, React Router, TanStack Router, or generic (`RoutePathProvider` supplies the path). Use `--router <name>` to override. Variant source lives in `src/routers/route-boundary.<variant>.tsx`. `AppShell` passes `routeFramework` to `PageTransition` for you.

### Where boundaries go

- **The root (app) layout holds only the provider** (`AppShell`, or `PageTransition` with `framework={routeFramework}`). It renders no boundary.
- **Every route-group layout renders `AppGroupLayout`** around its content, with persistent chrome such as the bottom tab bar **inside** it. `TabShell` is exactly that: `AppGroupLayout` plus the tab bar.
- **Every page renders `AppScreen`** (or `DetailScreen`) as its top-most element, with no wrapper element above it. Suspense and fragments are fine. `bar="tab" | "back" | "sheet"` picks the app bar; omit `bar` for screens that own their top edge and only need the boundary (no app bar, no safe-area spacing).
- **Intercepted `@modal` pages are not wrapped.** Keep the `{modal}` slot outside the group boundary, as a sibling; it animates by itself.

```text
app/
  (app)/layout.tsx                    # <AppShell tabs={APP_TABS}>{children}</AppShell>, no boundary
  (app)/(tabs)/layout.tsx             # <><TabShell>{children}</TabShell>{modal}</>
  (app)/(tabs)/page.tsx               # <AppScreen bar="tab" title="Home">…</AppScreen>
  (app)/(tabs)/search/page.tsx        # <AppScreen bar="tab" title="Search">…</AppScreen>
  (app)/(tabs)/@modal/(.)posts/[id]/page.tsx  # not wrapped
  (app)/(detail)/layout.tsx           # <AppGroupLayout>{children}</AppGroupLayout>
  (app)/(detail)/posts/[id]/page.tsx  # <DetailScreen fallback="/">…</DetailScreen>
```

```tsx
// app/(app)/(detail)/layout.tsx
import { AppGroupLayout } from '@/components/ui/app-group-layout'

export default function DetailLayout({ children }: { children: React.ReactNode }) {
  return <AppGroupLayout>{children}</AppGroupLayout>
}

// app/(app)/(detail)/posts/[id]/page.tsx
import { DetailScreen } from '@/components/ui/app-screen'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DetailScreen fallback="/">
      <Post id={id} />
    </DetailScreen>
  )
}
```

Tab → tab swaps only the page while the group and its tab bar stay. Tab → detail moves the whole tab group, tab bar included. Detail → detail swaps the page. Back reveals the route the user left, with its state.

**Why unkeyed boundaries:** with `cacheComponents`, Next.js keeps visited routes alive in React `<Activity>` instead of unmounting them, so Back restores their state. A keyed boundary (the old `RouteBoundary` with `routeKey`/`resolve`) forces a remount on every navigation and throws that state away. `AppScreen` and `AppGroupLayout` are SSGOI's `SsgoiPageBoundary`, which is never keyed: React hiding the route (`display: none !important` on its top-most host element) is the OUT, showing it again is the IN. That is why the boundary has to be the top-most element of the page or layout. Its id is the `pathname`, updated only while it is visible. Routers that unmount routes (React Router, TanStack Router, the generic shell) work the same way: give each route its own page component, or key `AppScreen` by path when one component renders several paths.

Everything needs a `framework` on the provider: a page boundary throws without one. `RouteBoundary` (from `route-boundary.tsx`) is the same unkeyed boundary with page defaults, for custom screens that don't use `AppScreen`. Don't mix keyed `PageBoundary` and unkeyed boundaries in the same region.

Without a router, `PageBoundary` is one DOM element whose key changes (`PageBoundary path=…`). When React unmounts the old page, the engine retains that node, places it absolutely above the new page, and animates both. This works with `useState` alone, as in the documentation phone demos:

```tsx
<PageTransition
  config={{ transitions: [{ on: '/posts/**', except: '/posts', transition: drill() }] }}
>
  <PageBoundary path={path}>{page}</PageBoundary>
</PageTransition>
```

Keep the app bar inside the page boundary so it moves with the page; `AppScreen` does this. If other chrome appears above a boundary, wrap it in a `relative` parent: exiting pages align to the nearest positioned ancestor's top edge. For `hero()`, add matching `data-hero-exit-key` / `data-hero-enter-key` and `data-hero-radius` to shared elements.

Rules (`on/except`, `from/to`, `ordered`), preset options, scroll restoration, and troubleshooting follow the [engine documentation](https://ssgoi.dev/docs). Configuration is the same; wrapper component names differ.

### Upgrading to 0.8.0

- **`AppScreen` without `bar` no longer renders a tab bar — add `bar="tab"`.** `bar` is optional: omitted means no app bar and no safe-area spacing (the boundary only). `bar="none"` and `bar={false}` are gone; omit `bar` instead. `DetailScreen` is unchanged (`variant="back" | "sheet"`).
- Pages render `AppScreen`/`DetailScreen` and route-group layouts render `AppGroupLayout` (or `TabShell`). `AppShell` no longer creates a boundary, and both need the `framework` that `AppShell` (or `PageTransition framework={routeFramework}`) provides.
- Removed: `resolveAppBoundary`, `AppBoundaryName`, `segmentsToPath`, `RouteLocation`, and the `resolve`/`routeKey`/`path` props of the router `RouteBoundary` (now an unkeyed boundary).
- Requires `@ssgoi/react` `^7.5.0-beta.2` (npm `beta` tag).

## Bottom sheets

`bottom-sheet` rises from the bottom. Drag or tap its top handle to close. Dragging the body also moves the sheet when the body scroller is at the top. The `@comwit/ui` `BottomSheet` primitive owns dragging, distance/velocity thresholds, and nested-scroll handoff. The template maps `--sheet-drag` to translation and `--sheet-drag-progress` to scrim opacity. `popup.sheet()` opens the same sheet.

## Chat

`chat` provides compound header, message, and composer sections. `Chat` fills its parent, which needs a height such as `h-dvh` or `flex-1 min-h-0`. `ChatMessages` is virtualized by [react-virtuoso](https://virtuoso.dev).

The `@comwit/ui` Chat primitive owns virtualization, scroll rules, unread counts, Enter/IME handling, and automatic height. Templates assemble parts and apply tokens using `data-tone` and `data-align`. Data shape is unrestricted: `items` accepts your model, and `isOwn` identifies your messages, defaulting to `role === 'user'`.

`mode` controls scrolling:

- **messenger:** own messages always scroll to the bottom; incoming messages follow only when already at the bottom. While reading earlier messages, a glass `ChatScrollToBottom` pill displays the unread count.
- **assistant:** the sent message anchors at the top and the answer grows beneath it. Bottom space shrinks as the answer fills it, preventing jumps. Answers longer than the viewport follow only when already at the bottom. Responses default to the surface-free `plain` tone.

```tsx
<div className="h-dvh">
  <Chat mode="messenger">
    <ChatHeader>
      <ChatTitle>Ava Chen</ChatTitle>
    </ChatHeader>
    <ChatMessages
      items={messages}
      isOwn={(m) => m.mine}
      footer={
        typing ? (
          <ChatMessage>
            <ChatTyping />
          </ChatMessage>
        ) : null
      }
    >
      {(m) => (
        <ChatMessage align={m.mine ? 'end' : 'start'}>
          <ChatBubble>{m.text}</ChatBubble>
          <ChatMessageMeta>{m.time}</ChatMessageMeta>
        </ChatMessage>
      )}
    </ChatMessages>
    <ChatComposer onSend={send} pending={streaming} onStop={stop} />
  </Chat>
</div>
```

`ChatComposer` sends with Enter and inserts a newline with Shift+Enter, ignoring Enter during IME composition. With no children it renders an input and send button; compose your own layout with `ChatComposerInput`, `ChatComposerActions`, and `ChatComposerSubmit`. Visuals use tokens: own bubbles `bg-primary`, others `bg-muted`, and composer `rounded-sheet` + `shadow-message`.

## Usage

```tsx
import { Button } from '@/components/ui/button' // Path copied by the CLI.

;<Button variant="secondary" size="lg">
  Save
</Button>
```

Behavior, accessibility, IME, focus, and calendar/time logic live in `@comwit/ui`. The installed file adds visual variants with cva, so changing Tailwind classes does not replace behavior.

## Components

The same groups as the documentation gallery, with specialized Comwit experiences first:

- **Mobile apps:** app-shell (`AppShell`, `TabShell`, tab-bar, and route-boundary with router variants), app-screen (`AppScreen`, `DetailScreen`), app-group-layout (`AppGroupLayout`), app-bar, bottom-nav, page-transition, pull-to-refresh, drag-scroller.
- **Chat:** `Chat`, `ChatHeader`, virtualized `ChatMessages`, `ChatMessage`, `ChatBubble`, `ChatTyping`, `ChatComposer`, and related parts.
- **Glass:** `Glass`, `GlassSurface`, `GlassButton`, dropdown-menu, popover. Dialogs, sheets, popups, and toasts use the same refractive glass with dense tint above scrims.
- **Feedback:** toast (`Toaster`, `toast()`, `Toast`), `lib/popup` (confirm, alert, sheet), alert, empty-state.
- **Pickers:** date-picker, time-picker, month-picker (desktop popovers/mobile sheets), calendar.
- **Selection:** segmented-control, chip, checkbox, radio-group, pager.
- **Forms and data:** text-field, autocomplete, select, form, data-table, editor.
- **Basics:** button, badge, input, input-group, textarea, label, switch, tabs, accordion, collapsible, dialog, sheet, card, table, avatar, separator, skeleton, pagination.

Shared helpers: `lib/utils` (token-aware `cn`), `lib/interaction` (focusRing and related classes), and `lib/popup` (overlay-kit wrapper).

Behavior hooks come from the engine: `import { ScrollChromeProvider, useScrollChrome, useMobile } from '@comwit/ui'`. They provide shared app-bar/bottom-nav scroll intent and mobile detection. There are no hook files to copy.

**Primitives own behavior; templates own styling.** App bars, bottom navigation, drag scrollers, pull-to-refresh, app shells, navigation depth, chat, and glass lenses all keep JavaScript behavior in `@comwit/ui`. Templates apply tokens to state attributes. Follow the same rule for new components: gestures, scrolling, and keyboard behavior become core options; templates contain classes and slot composition.

Picker, pager, and table labels default to English. Override `locale` and `labels` for other languages, or install Korean defaults with `comwit-ui init --locale ko`. The installed `lib/ui-text.ts` owns default text; app-level localization can pass translated props.

Preview variants in the UI catalog (`apps/ui-dev`, http://localhost:3007) and Storybook (`apps/storybook`, http://localhost:6008).
