"use dom";

import LittleWorldWebLazy from "@/src/components/blocks/LittleWorldWebLazy";
import React, { Suspense } from "react";

import { ErrorBoundary } from "@/src/components/ExpoErrorBoundary";
import { View } from "react-native";

export default function Page() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <LittleWorldWebLazy />
        </Suspense>
      </ErrorBoundary>
    </View>
  );
}
