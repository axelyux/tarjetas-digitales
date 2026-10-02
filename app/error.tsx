"use client";

import { CardUnavailable } from "@/components/card/CardUnavailable";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <CardUnavailable kind="error" />
      <div className="-mt-24 flex justify-center pb-24">
        <button type="button" className="btn" onClick={reset}>
          Reintentar
        </button>
      </div>
    </>
  );
}
