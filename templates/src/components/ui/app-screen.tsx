'use client'

/**
 * AppScreen — one screen with an app bar and body, and the page's transition boundary. Every page renders it (or
 * DetailScreen) as its top-most element; route-group layouts render AppGroupLayout instead.
 *
 * - bar="tab": tab root. Without a title/actions, only the top safe-area space remains. Uses flow behavior.
 * - bar="back": detail screen. Glass back button goes back with in-app history or replaces with fallback on direct entry. Uses reveal.
 * - bar="sheet": temporary task (creating/selecting). Close X on the right. Uses pinned behavior.
 * - bar="none": no app bar, such as a full-bleed hero with a manually placed FloatingBackButton. Keeps the top safe area.
 * - bar={false}: no app bar and no safe-area spacing, for screens that own their top edge (entry, payment,
 *   fullscreen) and only need the boundary.
 *
 *   <AppScreen title="Home" actions={<Button size="icon" variant="ghost"><Bell /></Button>}>…</AppScreen>
 *   <DetailScreen fallback="/posts" title={post.title}>…</DetailScreen>
 *
 * The root element is SSGOI's SsgoiPageBoundary, so the app bar moves with the page. It is never keyed: Next.js
 * Cache Components keeps visited routes alive in React <Activity> and hides the route's top-most host node
 * (hiding is the OUT, showing again is the IN, and Back restores state), so render AppScreen at the top of the
 * page with no wrapper element above it (Suspense and fragments are fine). Routers that unmount routes work too;
 * give each route its own page component (or key AppScreen by path) so a route change replaces the boundary.
 * Needs PageTransition with a framework above it; AppShell provides one. Intercepted @modal pages don't use it.
 *
 * className and other element props land on the boundary element, the element the transition moves, so its
 * background travels with it.
 *
 * DetailScreen is an alias for details, accepting variant ("back" | "sheet") instead of bar and adding bottom
 * safe-area spacing. @comwit/ui NavDepth, installed by AppShell, handles back navigation. AppShell sets
 * --app-safe-area-top, which becomes 0 when a banner is attached above the screen.
 */

import * as React from 'react'
import { useBackNavigation } from '@comwit/ui'
import { SsgoiPageBoundary } from '@ssgoi/react'

import {
  AppBar,
  AppBarActions,
  AppBarBackButton,
  AppBarTitle,
  type AppBarBehavior,
} from './app-bar'
import { cn } from '../../lib/utils'

export type AppScreenBar = 'tab' | 'back' | 'sheet' | 'none'

type AppScreenProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'title' | 'children'> & {
  children: React.ReactNode
  /** Defaults to "tab". false renders no app bar and no safe-area spacing. */
  bar?: AppScreenBar | false
  title?: string
  /** Node replacing the title area, such as a search field or segmented control. */
  leading?: React.ReactNode
  actions?: React.ReactNode
  /** Logical parent URL to use after direct entry when no back-navigation history exists. */
  fallback?: string
  /** Defaults: tab=flow, back=reveal, sheet=pinned. */
  appBarBehavior?: AppBarBehavior
}

function AppScreen({
  children,
  bar = 'tab',
  title,
  leading,
  actions,
  fallback = '/',
  appBarBehavior,
  className,
  ...props
}: AppScreenProps) {
  const back = useBackNavigation(fallback)
  const behavior =
    appBarBehavior ?? (bar === 'back' ? 'reveal' : bar === 'sheet' ? 'pinned' : 'flow')
  const empty = bar === 'none' || (bar === 'tab' && !title && !leading && !actions)

  return (
    <SsgoiPageBoundary
      {...props}
      data-slot="app-screen"
      className={cn('relative flex flex-1 flex-col bg-background', className)}
    >
      {bar === false ? null : empty ? (
        <div
          className="h-[var(--app-safe-area-top,env(safe-area-inset-top))] shrink-0"
          aria-hidden="true"
        />
      ) : (
        <AppBar behavior={behavior}>
          {bar === 'back' ? <AppBarBackButton onClick={back} /> : null}
          {leading ??
            (title ? <AppBarTitle size={bar === 'tab' ? 'lg' : 'md'}>{title}</AppBarTitle> : null)}
          {actions || bar === 'sheet' ? (
            <AppBarActions>
              {actions}
              {bar === 'sheet' ? <AppBarBackButton icon="close" onClick={back} /> : null}
            </AppBarActions>
          ) : null}
        </AppBar>
      )}
      <div className="flex-1">{children}</div>
    </SsgoiPageBoundary>
  )
}

type DetailScreenProps = Omit<AppScreenProps, 'bar' | 'fallback'> & {
  variant?: 'back' | 'sheet'
  /** Logical parent URL chosen by the page, used for back navigation after direct entry. */
  fallback: string
}

/** Fullscreen details: regular and intercepted routes use the same wrapper. */
function DetailScreen({ variant = 'back', className, ...props }: DetailScreenProps) {
  return (
    <AppScreen
      {...props}
      bar={variant}
      className={cn('pb-[env(safe-area-inset-bottom)]', className)}
    />
  )
}

export { AppScreen, DetailScreen }
export type { AppScreenProps, DetailScreenProps }
