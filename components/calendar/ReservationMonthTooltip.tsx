"use client";

import {
  cloneElement,
  useCallback,
  useId,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

import { getMonthReservationTooltipLines } from "@/lib/calendar/format-month-reservation-tooltip";
import type { Reservation } from "@/lib/calendar/types";

type ReservationMonthTooltipProps = {
  reservation: Reservation;
  children: ReactElement<{
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
    "aria-describedby"?: string;
  }>;
};

export function ReservationMonthTooltip({
  reservation,
  children,
}: ReservationMonthTooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const lines = getMonthReservationTooltipLines(reservation);

  const showAt = useCallback((target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    setCoords({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  const child = cloneElement(children, {
    onMouseEnter: (event) => {
      showAt(event.currentTarget);
      children.props.onMouseEnter?.(event);
    },
    onMouseLeave: (event) => {
      hide();
      children.props.onMouseLeave?.(event);
    },
    onFocus: (event) => {
      showAt(event.currentTarget);
      children.props.onFocus?.(event);
    },
    onBlur: (event) => {
      hide();
      children.props.onBlur?.(event);
    },
    "aria-describedby": visible ? tooltipId : children.props["aria-describedby"],
  });

  return (
    <>
      {child}
      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none fixed z-[60] max-w-[min(280px,calc(100vw-1.5rem))] rounded-lg border-[0.5px] border-border bg-bg-primary px-3 py-2.5"
              style={{
                left: coords.x,
                top: coords.y,
                transform: "translate(-50%, calc(-100% - 6px))",
              }}
            >
              <dl className="space-y-1.5">
                {lines.map((line) => (
                  <div key={line.label} className="flex gap-2 text-[11px] leading-snug">
                    <dt className="w-[4.5rem] shrink-0 text-text-tertiary">
                      {line.label}
                    </dt>
                    <dd className="min-w-0 font-medium text-text-primary">
                      {line.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
