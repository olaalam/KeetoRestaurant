import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-[size=default]:h-5 data-[size=default]:w-9",
        "data-[size=sm]:h-4 data-[size=sm]:w-7",
        className
      )}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
          "group-data-[size=default]/switch:size-4 group-data-[size=default]/switch:data-[state=checked]:translate-x-4 group-data-[size=default]/switch:data-[state=unchecked]:translate-x-0.5",
          "group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3 group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-0.5"
        )} />
    </SwitchPrimitive.Root>
  );
}

export { Switch }