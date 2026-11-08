'use client'

/**
 * AppShell / TabShell — TanStack Router integration, installed when comwit-ui add app-shell detects @tanstack/react-router.
 *
 * Complete mobile shell: phone frame, one main scroller, pull-to-refresh, shared scroll intent for app-bar
 * reveal and compact tab-bar behavior, page transitions, and back-navigation depth. @comwit/ui AppShell,
 * NavDepth, and ScrollChrome own behavior; this layer handles composition and appearance. Edit width
 * (max-w-md), background, and spinner here. globals.css [data-slot=app-shell] owns dvh height and installed-app adjustments.
 *
 *   // Root route: the provider only, no boundary. Wrap the routed area (Outlet) once.
 *   <AppShell tabs={APP_TABS}><Outlet /></AppShell>
 *   // Pathless layout route for tab screens: one group boundary around the tab pages and the tab bar.
 *   <TabShell><Outlet /></TabShell>
 *   // Pathless layout route for details: <AppGroupLayout><Outlet /></AppGroupLayout>
 *   // Every route page: <AppScreen …> or <DetailScreen …> at the top.
 *
 * AppShell holds no boundary. Boundaries are unkeyed (SSGOI SsgoiPageBoundary) and owned by the group layouts
 * (AppGroupLayout, TabShell) and pages (AppScreen); the route change that unmounts a page or group is its OUT.
 * Tab → tab swaps only the page while the group and its tab bar stay; tab → detail moves the whole tab group,
 * tab bar included. Give each route its own page component (or key AppScreen by path). Defaults to
 * appTransitions; supply transitions to customize.
 */

import * as React from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { AppShell as AppShellPrimitive, NavDepthProvider } from '@comwit/ui'

import { cn } from '../lib/utils'
import {
  PageTransition,
  appTransitions,
  type PageTransitionConfig,
} from '../components/ui/page-transition'
import { PullIndicator } from '../components/ui/pull-to-refresh'
import { AppGroupLayout } from '../components/ui/app-group-layout'
import { routeFramework } from './route-boundary.tanstack-router'
import { TabBar, type AppTab } from './tab-bar.tanstack-router'

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
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navRouter = React.useMemo(
    () => ({
      back: () => router.history.back(),
      replace: (href: string) => router.history.replace(href),
    }),
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
          {/* resetKey: expand hidden app bars and compact tab bars when the path changes. */}
          <AppShellPrimitive.Root onRefresh={onRefresh} resetKey={pathname}>
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

type TabShellProps = {
  className?: string
  children: React.ReactNode
}

/** Tab-group layout: one group boundary (AppGroupLayout) around the tab pages and the tab bar. Place in the tabs' layout route. */
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
