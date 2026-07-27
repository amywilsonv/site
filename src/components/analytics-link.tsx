"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

type AnalyticsLinkProps = ComponentProps<typeof Link> & {
  eventName: string
  eventPayload?: Record<string, string>
}

export function AnalyticsLink({
  eventName,
  eventPayload = {},
  onClick,
  ...props
}: AnalyticsLinkProps) {
  return (
    <Link
      {...props}
      data-analytics-event={eventName}
      onClick={(event) => {
        const detail = {
          event: eventName,
          payload: eventPayload,
          timestamp: new Date().toISOString(),
        }
        window.dispatchEvent(
          new CustomEvent("portfolio:analytics", { detail }),
        )
        ;(window as Window & { portfolioAnalyticsEvents?: typeof detail[] })
          .portfolioAnalyticsEvents = [
          ...((window as Window & { portfolioAnalyticsEvents?: typeof detail[] })
            .portfolioAnalyticsEvents || []),
          detail,
        ]
        onClick?.(event)
      }}
    />
  )
}
