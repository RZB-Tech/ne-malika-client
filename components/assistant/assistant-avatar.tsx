"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function AssistantAvatar({
  animated = false,
  className,
}: {
  animated?: boolean;
  className?: string;
}) {
  const id = useId();

  return (
    <span
      aria-hidden="true"
      className={cn("assistant-avatar relative inline-flex size-14 shrink-0", className)}
      data-animated={animated}
    >
      <svg viewBox="0 0 64 64" fill="none" className="size-full overflow-visible" focusable="false">
        <defs>
          <linearGradient
            id={`${id}-shell`}
            x1="12"
            y1="7"
            x2="51"
            y2="57"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#93E8FF" />
            <stop offset="0.35" stopColor="#508AFF" />
            <stop offset="0.75" stopColor="#5254E8" />
            <stop offset="1" stopColor="#A68AFF" />
          </linearGradient>
          <linearGradient
            id={`${id}-screen`}
            x1="22"
            y1="21"
            x2="42"
            y2="45"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#203C80" />
            <stop offset="1" stopColor="#111A42" />
          </linearGradient>
          <linearGradient
            id={`${id}-shine`}
            x1="17"
            y1="12"
            x2="37"
            y2="41"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.75" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#7285FF" stopOpacity="0.5" />
            <stop offset="1" stopColor="#7285FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          className="assistant-avatar__glow"
          cx="32"
          cy="34"
          r="34"
          fill={`url(#${id}-glow)`}
        />
        <g className="assistant-avatar__body">
          <path
            d="M32 6C17.6 6 7 16.5 7 30.5C7 43.2 15.8 52.3 28.3 54L25.5 60L38.5 54C50 51.4 57 42.2 57 30.5C57 16.5 46.4 6 32 6Z"
            fill={`url(#${id}-shell)`}
          />
          <path
            d="M32 7C18.2 7 8 17 8 30.5C8 42.7 16.5 51.5 28.4 53"
            stroke={`url(#${id}-shine)`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="25"
            cy="16"
            rx="12"
            ry="6"
            fill={`url(#${id}-shine)`}
            transform="rotate(-24 25 16)"
          />
          <rect x="14" y="20" width="36" height="26" rx="12" fill={`url(#${id}-screen)`} />
          <rect
            x="14.5"
            y="20.5"
            width="35"
            height="25"
            rx="11.5"
            stroke="#C4D6FF"
            strokeOpacity="0.35"
          />
          <path
            d="M20 25C25 22.5 34 22.5 39 24"
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g className="assistant-avatar__eyes" fill="#A4F5FF">
            <rect x="22" y="28" width="5" height="9" rx="2.5" />
            <rect x="37" y="28" width="5" height="9" rx="2.5" />
          </g>
          <path d="M29 39Q32 42 35 39" stroke="#A4F5FF" strokeWidth="1.7" strokeLinecap="round" />
          <ellipse cx="19.5" cy="37" rx="2.5" ry="1" fill="#9B9CFF" fillOpacity="0.55" />
          <ellipse cx="44.5" cy="37" rx="2.5" ry="1" fill="#9B9CFF" fillOpacity="0.55" />
        </g>
        <g className="assistant-avatar__sparkle">
          <path
            d="M54 4L56.4 10.6L63 13L56.4 15.4L54 22L51.6 15.4L45 13L51.6 10.6L54 4Z"
            fill="#C4F7FF"
            stroke="#5F83F1"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M54 8V18M49 13H59" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  );
}
