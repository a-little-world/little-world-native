"use dom";

import React, { Suspense, lazy } from "react";

// Dynamic import at component level to avoid hook errors
const LittleWorldWebNative = lazy(() => import("littleplanet").then(module => ({ 
  default: module.LittleWorldWebNative 
})));

export default function LittleWorldWebLazy() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LittleWorldWebNative />
    </Suspense>
  );
}