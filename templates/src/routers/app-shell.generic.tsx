'use client'

/**
 * AppShell / TabShell — default implementation installed when no router is detected. Supply the current path manually.
 *
 * Complete mobile shell: phone frame, one main scroller, pull-to-refresh, shared scroll intent for app-bar
 * reveal and compact tab-bar behavior, page transitions, and back-navigation depth. @comwit/ui AppShell,
 * NavDepth, and ScrollChrome own behavior; this layer handles composition and appearance. Edit width
 * (max-w-md), background, and spinner here. globals.css [data-slot=app-shell] owns dvh height and installed-app adjustments.
 *
 *   const [path, setPath] = useState('/') // In real apps, use the router pathname and push.
 *   <AppShell tabs={TABS} path={path} onNavigate={setPath}>
 *     {isTab ? (
 *       <TabShell><AppScreen key={path} bar="tab" title={title}>{page}</AppScreen></TabShell>
 *     ) : (
 *       <AppGroupLayout><DetailScreen key={path} fallback="/">{page}</DetailScreen></AppGroupLayout>
 *     )}
 *   </AppShell>
 *
 * AppShell holds no boundary; it provides path to the boundaries (routeFramework + RoutePathProvider). Group
 * layouts (TabShell, AppGroupLayout) and pages (AppScreen) are unkeyed boundaries (SSGOI SsgoiPageBoundary):
 * the change that unmounts one is its OUT. Tab → tab swaps only the page while TabShell and its tab bar stay;
 * tab → detail moves the whole tab group, tab bar included. Key a page by path when one component renders
 * several paths. Without onNavigate, tabs use a href with full page loads, and back-navigation fallback uses
 * location.replace.
 *
 * For supported routers (next, react-router, @tanstack/react-router), reinstall the complete integration with
 * comwit-ui add app-shell --router <name>.
 */

import * as React from 'react'
import { AppShell as AppShellPrimitive, NavDepthProvider } from '@comwit/ui'

import { cn } from '../lib/utils'
import { AppGroupLayout } from '../components/ui/app-group-layout'
import {
  PageTransition,
  appTransitions,
  type PageTransitionConfig,
} from '../components/ui/page-transition'
import { PullIndicator } from '../components/ui/pull-to-refresh'
import { RoutePathProvider, routeFramework } from './route-boundary.generic'
import { TabBar, type AppTab } from './tab-bar.generic'

type AppShellProps = {
  /** Tab list: order determines both the tab-bar order and transition direction. */
  tabs: readonly AppTab[]
  /** Current path, synchronized with render. Do not read window.location only at mount time. */
  path: string
  /** Tab navigation and back-navigation fallback use this callback. Defaults to full page loads. */
  onNavigate?: (href: string) => void
  /** Transition rules. Defaults to appTransitions(tab paths): horizontal tab transitions, drill elsewhere. Syntax: https://ssgoi.dev/llms.txt */
  transitions?: PageTransitionConfig
  /** Content above the scroller, such as an install banner. When present, it owns the top safe area. */
  top?: React.ReactNode
  /** Pull-to-refresh callback. Omit to disable the gesture. */
  onRefresh?: () => Promise<unknown> | void
  className?: string
  children: React.ReactNode
}

type AppShellContextValue = {
  tabs: readonly AppTab[]
  path: string
  onNavigate?: (href: string) => void
}

const AppShellContext = React.createContext<AppShellContextValue>({ tabs: [], path: '/' })

function AppShell({
  tabs,
  path,
  onNavigate,
  transitions,
  top,
  onRefresh,
  className,
  children,
}: AppShellProps) {
  const navRouter = React.useMemo(
    () => (onNavigate ? { back: () => window.history.back(), replace: onNavigate } : undefined),
    [onNavigate]
  )
  const tabPaths = React.useMemo(() => tabs.map((tab) => tab.href), [tabs])
  const config = React.useMemo(
    () => transitions ?? appTransitions(tabPaths),
    [transitions, tabPaths]
  )
  const context = React.useMemo(() => ({ tabs, path, onNavigate }), [tabs, path, onNavigate])

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
          <AppShellPrimitive.Root onRefresh={onRefresh} resetKey={path}>
            <PullIndicator />
            <AppShellPrimitive.Scroller>
              <PageTransition config={config} framework={routeFramework} className="min-h-full">
                <RoutePathProvider path={path}>{children}</RoutePathProvider>
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

/** Tab-group layout: one group boundary (AppGroupLayout) around the tab pages and the tab bar. Wrap tab pages with this. */
function TabShell({ className, children }: TabShellProps) {
  const { tabs, path, onNavigate } = React.useContext(AppShellContext)
  return (
    <AppGroupLayout className={className}>
      {children}
      <TabBar tabs={tabs} value={path} onNavigate={onNavigate} />
    </AppGroupLayout>
  )
}

export { AppShell, TabShell }
export type { AppShellProps, TabShellProps }
