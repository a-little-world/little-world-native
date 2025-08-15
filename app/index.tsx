"use dom";

import LittleWorldWebLazy from "@/src/components/blocks/LittleWorldWebLazy";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LittleWorldWebLazy />
    </Suspense>
  );
}
