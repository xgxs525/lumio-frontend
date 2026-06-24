"use client";

import { useEffect, type RefObject } from "react";

function normalizeWheelDelta(event: WheelEvent) {
  const lineHeight = 16;
  const pageHeight = window.innerHeight || 800;

  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return { x: event.deltaX * lineHeight, y: event.deltaY * lineHeight };
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return { x: event.deltaX * pageHeight, y: event.deltaY * pageHeight };
  }

  return { x: event.deltaX, y: event.deltaY };
}

export function isolateWheelScroll(element: HTMLElement, event: WheelEvent) {
  const { x, y } = normalizeWheelDelta(event);
  const canScrollY = element.scrollHeight > element.clientHeight;
  const canScrollX = element.scrollWidth > element.clientWidth;

  event.preventDefault();
  event.stopPropagation();

  if (!canScrollX && !canScrollY) return;

  if (canScrollX && (Math.abs(x) > 0 || event.shiftKey)) {
    element.scrollLeft += x || y;
  }

  if (canScrollY && !event.shiftKey) {
    element.scrollTop += y;
  }
}

export function useIsolatedWheelScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      isolateWheelScroll(element, event);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  });
}
