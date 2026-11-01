'use client'

/**
 * routeFramework / RouteBoundary — TanStack Router integration, installed when comwit-ui add page-transition
 * detects @tanstack/react-router.
 *
 * routeFramework tells the engine how to read the router; pass it to PageTransition once, inside the router.
 * AppShell does this for you. It reads the leaf match the outlet renders, not location: TanStack Router moves
 * location before pending matches render, so reading it would move the outgoing page's id early. Index routes
 * match as "/parent/", so the location's own trailing-slash style wins. (Snippet from the @ssgoi/react README.)
 *
 *   <PageTransition config={transitions} framework={routeFramework}><Outlet /></PageTransition>
 *   // Pathless layout routes for route groups render AppGroupLayout; route pages render AppScreen.
 *
 * Boundaries are unkeyed (SSGOI SsgoiPageBoundary): when a route change unmounts a route's element, that
 * boundary leaves (OUT) and the new route's boundary enters (IN). Give each route its own page component (or key
 * AppScreen by path); one component re-rendered for another path does not unmount, so nothing moves.
 *
 * RouteBoundary is the same unkeyed boundary with page defaults, for custom screens that don't use AppScreen.
 * See https://ssgoi.dev/llms.txt for the boundary contract.
 */

import * as React from 'react'
import { useRouterState } from '@tanstack/react-router'
import { SsgoiPageBoundary, type SsgoiPageBoundaryProps } from '@ssgoi/react'

import { cn } from '../lib/utils'
import type { PageTransitionFramework } from '../components/ui/page-transition'

/** Router adapter for PageTransition framework. Module scope keeps it stable. */
export const routeFramework: PageTransitionFramework = {
  useRoute: () => ({
    pathname: useRouterState({
      select: (state) => {
        const location = state.location.pathname
        const leaf = state.matches.at(-1)?.pathname
        if (!leaf) return location
        return leaf.length > 1 && leaf.endsWith('/') && !location.endsWith('/')
          ? leaf.slice(0, -1)
          : leaf
      },
    }),
  }),
}

/** as and element attributes. No route props: the boundary reads the route itself. */
export type RouteBoundaryProps<T extends React.ElementType = 'div'> = SsgoiPageBoundaryProps<T>

function RouteBoundary<T extends React.ElementType = 'div'>(props: RouteBoundaryProps<T>) {
  const { className, ...rest } = props as { className?: string }
  return (
    <SsgoiPageBoundary<T>
      {...(rest as RouteBoundaryProps<T>)}
      data-slot="page-boundary"
      // grow fills the flex-column shell in normal flow; min-h-full preserves shell height while exiting absolutely.
      className={cn('min-h-full grow', className)}
    />
  )
}

export { RouteBoundary }
