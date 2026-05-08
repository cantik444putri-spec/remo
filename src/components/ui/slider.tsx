import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
      <SliderPrimitive.Range className="absolute h-full gradient-accent" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block size-3.5 rounded-full border border-white/30 bg-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-transform hover:scale-110"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;
