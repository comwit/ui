'use client'

/**
 * PageTransition — native app-style route transitions (drill, sheet, slide, and more).
 *
 * Keep the router. PageTransition mounts the engine once; route-owned boundaries mark what moves. The engine
 * observes boundaries appearing/disappearing, briefly retaining exiting pages to animate them.
 *
 *   const transitions = {
 *     transitions: [
 *       { on: '/posts/**', except: '/posts', transition: drill() },  // List → detail.
 *       { on: '/compose', transition: sheet({ type: 'blur' }) },      // Temporary task.
 *       { ordered: ['/home', '/search', '/me'], transition: slide() }, // Tabs.
 *     ],
 *   } satisfies PageTransitionConfig
 *
 * Apps with a router: pass the router adapter as framework (routeFramework from route-boundary.tsx, installed
 * by CLI router detection) and let screens own the boundaries. Pages render AppScreen (app-screen.tsx) and
 * route-group layouts render AppGroupLayout (app-group-layout.tsx); both are unkeyed page boundaries, so the
 * root layout holds only the provider. AppShell (app-shell.tsx) wires all of this for you.
 *
 *   <PageTransition config={transitions} framework={routeFramework}>{children}</PageTransition>
 *   // (tabs)/layout.tsx:      <AppGroupLayout>{children}<BottomNav … /></AppGroupLayout>
 *   // (tabs)/search/page.tsx: <AppScreen title="Search">…</AppScreen>
 *
 * An unkeyed boundary never forces a remount. Next.js Cache Components keeps visited routes alive in React
 * <Activity>: hiding a route is the OUT, showing it again is the IN, and Back restores its state. Routers that
 * unmount routes work the same way. Intercepted @modal pages are not wrapped; the slot animates by itself.
 *
 * Without a router, PageBoundary is the keyed low-level boundary: path is the logical rule-matching path;
 * routeKey is the DOM lifetime key (defaults to path). A key change remounts the element, which the engine turns
 * into a transition, so state alone (const [path, setPath] = useState('/notes')) drives it:
 *
 *   <PageTransition config={transitions}>
 *     <PageBoundary path={pathname}>{children}</PageBoundary>
 *   </PageTransition>
 *
 * Don't mix keyed PageBoundary and unkeyed page boundaries (AppScreen, AppGroupLayout, RouteBoundary) in the
 * same region.
 *
 * - PageTransition: mount once at the app root. Provides a flex-column layout shell, filled by growing boundaries.
 *   Percentage min-height cannot resolve against an auto-height parent, so this wiring keeps sticky tab bars
 *   at the bottom of short pages. The scroller owns positioning, stacking, and horizontal clipping; see below.
 * - Boundaries default to grow + min-h-full: they fill the shell in normal flow and preserve shell height while
 *   exiting absolutely, keeping sticky bars at the bottom.
 *
 * Keep the app bar inside the page boundary so it moves with the page. A persistent shell contains only
 * elements below the page, such as the tab bar. With keyed boundaries, fix the outer routeKey while the inner
 * boundary changes pages:
 *
 *   <PageBoundary routeKey="tabs" className="flex min-h-full flex-col">
 *     <PageBoundary path={pathname} className="flex-1">      // Page, including its app bar.
 *       <AppBar … />
 *       {children}
 *     </PageBoundary>
 *     <BottomNav … />
 *   </PageBoundary>
 *
 * Scroller: exiting pages are positioned absolutely at the top of the nearest positioned ancestor.
 * One scroller owns that positioning context, stacking context, and horizontal clipping, as in a native app shell:
 *
 *   <main className="relative z-0 min-h-0 flex-1 overflow-x-clip overflow-y-auto"> // The app's only scroller.
 *     <PageTransition config={transitions} className="min-h-full">…</PageTransition>
 *   </main>
 *
 * For document scrolling, use <body className="relative z-0 overflow-x-clip">. Use clip: hidden creates a scroll
 * container and breaks sticky positioning and scroll restoration. Place PageTransition at the scroller's top;
 * if content precedes it, wrap it in a relative parent. Avoid overflow ancestors between the scroller and sticky
 * tab bar; they prevent iOS WebKit from aligning sticky content on the scroll thread and cause jitter.
 *
 * Rules: on/except (hierarchy entry/exit), from/to (exact pairs), ordered (tab order). Back navigation reverses
 * the effect. Rules automatically restore/reset scroll positions. The engine is ssgoi: see https://ssgoi.dev/llms.txt
 * for rule syntax (on/except, from/to, ordered, priority), preset options, middleware, and scrollLock.
 * For hero transitions, give shared elements matching data-hero-exit-key and data-hero-enter-key values.
 * Set data-hero-radius in pixels on both; the engine uses it to interpolate corners instead of reading CSS radius.
 */

import * as React from 'react'
import { Ssgoi, type SsgoiConfig, type SsgoiFramework } from '@ssgoi/react'
import { axis, drill } from '@ssgoi/react/view-transitions'

import { cn } from '../../lib/utils'

/** Transition rules: transitions array (or ({ isMobile }) => array), with optional middleware and scrollLock. Syntax: https://ssgoi.dev/llms.txt */
export type PageTransitionConfig = SsgoiConfig

/**
 * How the engine reads the router: a module-scope object whose useRoute hook returns { pathname } (or null
 * while the router isn't ready). route-boundary.tsx exports one for your router as routeFramework.
 */
export type PageTransitionFramework = SsgoiFramework

type PageTransitionProps = React.ComponentProps<'div'> & {
  config: PageTransitionConfig
  /** Router adapter. Required by unkeyed page boundaries (AppScreen, AppGroupLayout, RouteBoundary); keep it stable. */
  framework?: PageTransitionFramework
  children: React.ReactNode
}

/**
 * Mount once at the app root, outside the routed area. The shell defaults to document scrolling (min-h-dvh).
 * Inside a custom scroller, change only the height with className="min-h-full". The scroller owns horizontal clipping (see above).
 */
function PageTransition({ config, framework, className, children, ...props }: PageTransitionProps) {
  return (
    <div
      data-slot="page-transition"
      // Layout only: the scroller owns positioning (relative), stacking (z-0), and horizontal clipping (overflow-x-clip).
      // Overflow on the shell inserts an ancestor between sticky tabs and the scroller, causing tab-bar jitter on iOS.
      className={cn('flex min-h-dvh flex-col', className)}
      {...props}
    >
      <Ssgoi config={config} framework={framework}>
        {children}
      </Ssgoi>
    </div>
  )
}

export type PageBoundaryProps<T extends React.ElementType = 'div'> = {
  /** Logical path matched by transition rules, usually the router pathname. */
  path: string
  /** DOM lifetime key. Defaults to path. Use a fixed string for a shell whose header/tab bar should persist. */
  routeKey?: string | number
  as?: T
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'path' | 'routeKey'>

/**
 * Keyed route-owned DOM boundary for router-less use (state-driven demos). When the key changes, React recreates the element and the engine animates that replacement.
 * Compute path and routeKey during render; deferring to an effect would remove the old page too early.
 */
function PageBoundary<T extends React.ElementType = 'div'>({
  path,
  routeKey,
  as,
  children,
  ...props
}: PageBoundaryProps<T>) {
  const Component: React.ElementType = as ?? 'div'
  const { className, ...rest } = props as { className?: string }
  return (
    <Component
      {...rest}
      key={routeKey ?? path}
      data-slot="page-boundary"
      data-ssgoi-transition={path}
      // grow fills the flex-column shell in normal flow; min-h-full preserves shell height while exiting absolutely.
      // Without both, short pages shrink and pull sticky tab/action bars upward.
      className={cn('min-h-full grow', className)}
    >
      {children}
    </Component>
  )
}

type TransitionRules = Extract<NonNullable<PageTransitionConfig['transitions']>, readonly unknown[]>

/**
 * Default mobile app rules: tab-to-tab transitions follow tab order horizontally while the tab group boundary
 * (TabShell / AppGroupLayout) stays, keeping the tab bar still. All other entries use drill; browser back reverses it. Add specific screen
 * relationships through transitions, which take precedence over the fallback.
 *
 *   appTransitions(APP_TAB_PATHS, {
 *     transitions: [{ on: ['/compose', '/posts/new'], transition: sheet({ type: 'static' }) }],
 *   })
 *
 * Apps without aliases use paths as-is; /posts/1 and /posts/2 remain distinct. User scroll input is locked during
 * transitions by default (scrollLock); set false only when the app manages input itself.
 */
function appTransitions(
  tabPaths: readonly string[],
  extra: { transitions?: TransitionRules; scrollLock?: boolean } = {}
): PageTransitionConfig {
  const tabs = [...tabPaths]
  return {
    middleware: (from, to) => ({ from, to }),
    ...(extra.scrollLock === undefined ? {} : { scrollLock: extra.scrollLock }),
    transitions: [
      { ordered: tabs, transition: axis({ type: 'x', feel: 'snappy' }) },
      ...(extra.transitions ?? []),
      { priority: -100, on: '/**', except: tabs, transition: drill() },
    ],
  }
}

export { PageTransition, PageBoundary, appTransitions }

// Transition presets are named by UX intent. Options (type, feel, spring, etc.): https://ssgoi.dev/llms.txt. More effects (film, strip, rotate, etc.) are in @ssgoi/react/view-transitions.
//   drill: list → detail hierarchy; sheet: temporary tasks such as compose/filters; slide: ordered tabs.
//   axis: Material shared axis; zoom: card expands into details; hero: element shared by two pages.
//   fade: subtle sequential fade.
export { drill, sheet, slide, axis, zoom, hero, fade } from '@ssgoi/react/view-transitions'
