'use client'

/**
 * AppGroupLayout — the transition boundary of a route-group layout: the layout that owns a group of pages, such
 * as tab roots or a detail stack. Wrap the layout's whole content in it, with persistent chrome like the bottom
 * tab bar INSIDE it:
 *
 *   // app/(app)/(tabs)/layout.tsx
 *   <AppGroupLayout>
 *     {children}
 *     <TabBar tabs={APP_TABS} />
 *   </AppGroupLayout>
 *   // app/(app)/(detail)/layout.tsx
 *   <AppGroupLayout>{children}</AppGroupLayout>
 *
 * - Tab → tab: the group stays and only the page boundary (AppScreen) changes, so the tab bar stays put.
 * - Tab → detail: the whole group, tab bar included, leaves. Back reveals it again with its state.
 * - Intercepted @modal slots sit outside it as siblings; modal pages are not wrapped.
 *
 * It is SSGOI's SsgoiPageBoundary, which is never keyed: Next.js Cache Components keeps visited routes alive in
 * React <Activity> and hides the route's top-most host node, so render AppGroupLayout at the top of the layout
 * with no wrapper element above it (Suspense and fragments are fine). Routers that unmount routes work too.
 * Needs PageTransition with a framework above it (AppShell provides one). Group layouts only: pages render
 * AppScreen, and the root layout that holds the provider renders no boundary.
 *
 * className lands on the boundary element, the element the transition moves, so its background travels with it.
 */

import * as React from 'react'
import { SsgoiPageBoundary, type SsgoiPageBoundaryProps } from '@ssgoi/react'

import { cn } from '../../lib/utils'

type AppGroupLayoutProps = Omit<SsgoiPageBoundaryProps<'div'>, 'as'>

function AppGroupLayout({ className, children, ...props }: AppGroupLayoutProps) {
  return (
    <SsgoiPageBoundary
      {...props}
      data-slot="app-group-layout"
      // grow fills the flex-column shell in normal flow; min-h-full preserves shell height while exiting absolutely.
      className={cn('flex min-h-full grow flex-col bg-background', className)}
    >
      {children}
    </SsgoiPageBoundary>
  )
}

export { AppGroupLayout }
export type { AppGroupLayoutProps }
