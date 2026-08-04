import posthog from "posthog-js";

let started = false;

export function initAnalytics() {
  if (started || typeof window === "undefined") return;
  const token = import.meta.env["VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY"];
  if (!token) return;
  const region = import.meta.env["VITE_LOVABLE_CONNECTOR_POSTHOG_REGION"] || "eu";
  posthog.init(token, {
    api_host: region === "us" ? "https://us.i.posthog.com" : "https://eu.i.posthog.com",
    capture_pageview: false,
    autocapture: true,
    session_recording: { maskAllInputs: true },
    capture_pageleave: true,
  });
  started = true;
}

export function trackPageView(path: string) {
  if (!started) return;
  posthog.capture("$pageview", { path });
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!started) return;
  posthog.capture(event, properties);
}
