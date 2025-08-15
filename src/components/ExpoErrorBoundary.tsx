// src/components/dev/ErrorBoundary.tsx
import React from "react";
import { Text, View, ScrollView } from "react-native";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  state = { error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) {
    // This will show up in `adb logcat -s ReactNativeJS`
    console.log("ErrorBoundary caught:", error?.message, error?.stack, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, justifyContent: "center" }}>
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>Something crashed:</Text>
          <Text selectable style={{ marginBottom: 16 }}>{String(this.state.error)}</Text>
          
          {this.state.error.stack && (
            <>
              <Text style={{ fontWeight: "600", marginBottom: 8 }}>Stack trace:</Text>
              <Text selectable style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 16 }}>
                {this.state.error.stack}
              </Text>
            </>
          )}
          
          {this.state.error.message && (
            <>
              <Text style={{ fontWeight: "600", marginBottom: 8 }}>Error message:</Text>
              <Text selectable style={{ marginBottom: 16 }}>{this.state.error.message}</Text>
            </>
          )}
        </ScrollView>
      );
    }
    return this.props.children as any;
  }
}