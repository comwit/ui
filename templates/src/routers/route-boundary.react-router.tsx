'use client'

/**
 * routeFramework / RouteBoundary — React Router integration, installed when comwit-ui add page-transition detects
 * react-router.
 *
 * routeFramework tells the engine how to read the router; pass it to PageTransition once, inside the router.
 * AppShell does this for you.
 *
 *   <PageTransition config={transitions} framework={routeFramework}><Outlet /></PageTransition>
 *   // Layout routes for route groups render AppGroupLayout; route pages render AppScreen (or DetailScreen).
 *
 * Boundaries are unkeyed (SSGOI SsgoiPageBoundary): when a route change unmounts a route's element, that
 * boundary leaves (OUT) and the new route's boundary enters (IN). Give each route its own page component (or key
 * AppScreen by path); one component re-rendered for another path does not unmount, so nothing moves.
 * Query-only navigation keeps the boundary.
 *
 * RouteBoundary is the same unkeyed boundary with page defaults, for custom screens that don't use AppScreen.
 * See https://ssgoi.dev/llms.txt for the boundary contract.
 */

import * as React from 'react'
import { useLocation } from 'react-router'
import { SsgoiPageBoundary, type SsgoiPageBoundaryProps } from '@ssgoi/react'

import { cn } from '../lib/utils'
import type { PageTransitionFramework } from '../components/ui/page-transition'

/** Router adapter for PageTransition framework. Module scope keeps it stable. */
export const routeFramework: PageTransitionFramework = { useRoute: () => useLocation() }

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
