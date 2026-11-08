'use client'

/**
 * AppShell / TabShell — Next.js App Router integration, installed when comwit-ui add app-shell detects next.
 *
 * Complete mobile shell: phone frame, one main scroller, pull-to-refresh, shared scroll intent for app-bar
 * reveal and compact tab-bar behavior, page transitions, and back-navigation depth. @comwit/ui AppShell,
 * NavDepth, and ScrollChrome own behavior; this layer handles composition and appearance. Edit width
 * (max-w-md), background, and spinner here. globals.css [data-slot=app-shell] owns dvh height and installed-app adjustments.
 *
 *   // (app)/layout.tsx: the provider only, no boundary.
 *   <AppShell tabs={APP_TABS} top={<InstallBanner />}>{children}</AppShell>
 *   // (app)/(tabs)/layout.tsx: one group boundary around the tab pages and the tab bar; {modal} outside it.
 *   <><TabShell>{children}</TabShell>{modal}</>
 *   // (app)/(detail)/layout.tsx: fullscreen details.
 *   <AppGroupLayout>{children}</AppGroupLayout>
 *   // Every page: <AppScreen …> or <DetailScreen …> at the top. Intercepted @modal pages are not wrapped.
 *
 * AppShell holds no boundary. Boundaries are unkeyed (SSGOI SsgoiPageBoundary) and owned by the group layouts
 * (AppGroupLayout, TabShell) and pages (AppScreen): with cacheComponents, Next.js keeps visited routes alive in
 * React <Activity>, so hiding a route is the OUT and showing it is the IN, and Back restores its state because
 * nothing forces a remount. Tab → tab swaps only the page while the group and its tab bar stay; tab → detail
 * moves the whole tab group, tab bar included. Defaults to appTransitions (tab axis + drill); supply transitions
 * to customize.
 */

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppShell as AppShellPrimitive, NavDepthProvider, useScrollChrome } from '@comwit/ui'

import { cn } from '../lib/utils'
import {
  PageTransition,
  appTransitions,
  type PageTransitionConfig,
} from '../components/ui/page-transition'
import { PullIndicator } from '../components/ui/pull-to-refresh'
import { AppGroupLayout } from '../components/ui/app-group-layout'
import { routeFramework } from './route-boundary.nextjs'
import { TabBar, type AppTab } from './tab-bar.nextjs'

type AppShellProps = {
  /** Tab list: order determines both the tab-bar order and transition direction. */
  tabs: readonly AppTab[]
  /** Transition rules. Defaults to appTransitions(tab paths): horizontal tab transitions, drill elsewhere. Syntax: https://ssgoi.dev/llms.txt */
  transitions?: PageTransitionConfig
  /** Content above the scroller, such as an install banner. When present, it owns the top safe area. */
  top?: React.ReactNode
  /** Pull-to-refresh callback. Omit to disable the gesture. */
  onRefresh?: () => Promise<unknown> | void
  className?: string
  children: React.ReactNode
}

const AppShellContext = React.createContext<{ tabs: readonly AppTab[] }>({ tabs: [] })

function AppShell({ tabs, transitions, top, onRefresh, className, children }: AppShellProps) {
  const router = useRouter()
  const navRouter = React.useMemo(
    () => ({ back: () => router.back(), replace: (href: string) => router.replace(href) }),
    [router]
  )
  const tabPaths = React.useMemo(() => tabs.map((tab) => tab.href), [tabs])
  const config = React.useMemo(
    () => transitions ?? appTransitions(tabPaths),
    [transitions, tabPaths]
  )
  const context = React.useMemo(() => ({ tabs }), [tabs])

  return (
    <AppShellContext.Provider value={context}>
      <NavDepthProvider router={navRouter}>
        <div
          data-slot="app-shell"
          className={cn(
            'mx-auto flex w-full max-w-md flex-col overflow-hidden bg-background',
            className
          )}
        >
          {top != null ? (
            <div data-slot="app-shell-top" className="shrink-0">
              {top}
            </div>
          ) : null}
          <AppShellPrimitive.Root onRefresh={onRefresh}>
            <React.Suspense fallback={null}>
              <ExpandChromeOnRouteChange />
            </React.Suspense>
            <PullIndicator />
            <AppShellPrimitive.Scroller>
              <PageTransition config={config} framework={routeFramework} className="min-h-full">
                {children}
              </PageTransition>
            </AppShellPrimitive.Scroller>
          </AppShellPrimitive.Root>
        </div>
      </NavDepthProvider>
    </AppShellContext.Provider>
  )
}

/** Isolate URL reading in a small Suspense leaf so the rest of the shell prerenders statically. Path changes expand hidden app bars and compact tab bars. */
function ExpandChromeOnRouteChange() {
  const pathname = usePathname()
  const { expand } = useScrollChrome()
  React.useEffect(() => {
    expand()
  }, [expand, pathname])
  return null
}

type TabShellProps = {
  className?: string
  children: React.ReactNode
}

/**
 * Tab-group layout: one group boundary (AppGroupLayout) around the tab pages and the tab bar. Place in the
 * (tabs) layout; keep its {modal} slot outside as a sibling.
 */
function TabShell({ className, children }: TabShellProps) {
  const { tabs } = React.useContext(AppShellContext)
  return (
    <AppGroupLayout className={className}>
      {children}
      <TabBar tabs={tabs} />
    </AppGroupLayout>
  )
}

export { AppShell, TabShell }
export type { AppShellProps, TabShellProps }
