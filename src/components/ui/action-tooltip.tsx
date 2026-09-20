"use client"

import type { ReactElement } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ActionTooltipProps = {
  label: string
  side?: "top" | "right" | "bottom" | "left"
  children: ReactElement
}

function ActionTooltip({ label, side = "top", children }: ActionTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export { ActionTooltip }