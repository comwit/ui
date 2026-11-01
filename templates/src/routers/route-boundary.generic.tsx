'use client'

/**
 * routeFramework / RoutePathProvider / RouteBoundary — default implementation installed when no router is detected.
 *
 * routeFramework tells the engine how to read the route; pass it to PageTransition once. Without a router hook
 * it reads the path RoutePathProvider supplies, so provide the router's current pathname synchronized with
 * render (do not read window.location only at mount time). AppShell does both from its path prop.
 *
 *   <PageTransition config={transitions} framework={routeFramework}>
 *     <RoutePathProvider path={pathname}>{children}</RoutePathProvider>
 *   </PageTransition>
 *   // Route-group layouts render AppGroupLayout; pages render AppScreen (or DetailScreen).
 *
 * Boundaries are unkeyed (SSGOI SsgoiPageBoundary): when a path change unmounts a page, its boundary leaves
 * (OUT) and the new page's boundary enters (IN). When one component renders several paths, key it by path
 * (<AppScreen key={path}>) so the change replaces it. To read a router hook instead, edit routeFramework:
 *
 *   export const routeFramework = { useRoute: () => ({ pathname: useMyRouter().pathname }) }
 *
 * For supported routers (next, react-router, @tanstack/react-router), reinstall the complete integration with
 * comwit-ui add page-transition --router <name>. Router-less demos can also use the keyed PageBoundary directly.
 */

import * as React from 'react'
import { SsgoiPageBoundary, type SsgoiPageBoundaryProps } from '@ssgoi/react'

import { cn } from '../lib/utils'
import type { PageTransitionFramework } from '../components/ui/page-transition'

const RoutePathContext = React.createContext<string | null>(null)

/** Supplies the current path to routeFramework. Place it inside PageTransition, around the routed area. */
function RoutePathProvider({ path, children }: { path: string; children: React.ReactNode }) {
  return <RoutePathContext.Provider value={path}>{children}</RoutePathContext.Provider>
}

/** Route adapter for PageTransition framework: reads RoutePathProvider. Module scope keeps it stable. */
export const routeFramework: PageTransitionFramework = {
  useRoute: () => {
    const pathname = React.useContext(RoutePathContext)
    return pathname == null ? null : { pathname }
  },
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

export { RouteBoundary, RoutePathProvider }
