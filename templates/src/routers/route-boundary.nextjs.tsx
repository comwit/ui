'use client'

/**
 * routeFramework / RouteBoundary — Next.js App Router integration, installed when comwit-ui add page-transition
 * detects next.
 *
 * routeFramework tells the engine how to read the router; pass it to PageTransition once. AppShell does this
 * for you. The useRoute hook is the snippet from the @ssgoi/react README, unchanged: pathname plus the page the
 * children slot renders (renderedPath), which page boundaries ignore and keyed layout boundaries use.
 *
 *   // app/(app)/layout.tsx: the provider only, no boundary.
 *   <PageTransition config={transitions} framework={routeFramework}>{children}</PageTransition>
 *   // Route-group layouts render AppGroupLayout; pages render AppScreen (or DetailScreen).
 *
 * Boundaries are unkeyed (SSGOI SsgoiPageBoundary). With cacheComponents, Next.js keeps visited routes alive in
 * React <Activity> instead of unmounting them: hiding a route is the OUT, showing it is the IN, and Back restores
 * its state because nothing forces a remount. A boundary's id is pathname, updated only while it is visible.
 * Intercepted @modal pages are not wrapped; keep the {modal} slot outside the group boundary.
 *
 * RouteBoundary is the same unkeyed boundary with page defaults, for custom screens that don't use AppScreen.
 * See https://ssgoi.dev/llms.txt for the boundary contract.
 */

import * as React from 'react'
import { usePathname, useSelectedLayoutSegments } from 'next/navigation'
import { SsgoiPageBoundary, type SsgoiPageBoundaryProps } from '@ssgoi/react'

import { cn } from '../lib/utils'
import type { PageTransitionFramework } from '../components/ui/page-transition'

const INTERCEPTION_PREFIX = /^(?:\(\.\.\.\)|\(\.\.\)|\(\.\))+/

/** Router adapter for PageTransition framework. Module scope keeps it stable. */
export const routeFramework: PageTransitionFramework = {
  useRoute: () => {
    const pathname = usePathname()
    // The page the children slot renders. During a soft intercept it is still
    // the background page, so no background boundary moves.
    const segments = useSelectedLayoutSegments()
    if (pathname == null) return null
    const renderedPath = `/${segments
      .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
      .map((segment) => segment.replace(INTERCEPTION_PREFIX, ''))
      .filter(Boolean)
      .join('/')}`
    return { pathname, renderedPath }
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

export { RouteBoundary }
