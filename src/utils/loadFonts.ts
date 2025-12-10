import * as Font from "expo-font";
import { fontFiles } from "@a-little-world/little-world-design-system-core";

export const loadFonts = async (): Promise<void> => {
  try {
    // fontFiles already has the correct font family names as keys
    // e.g. { 'Signika Negative': require(...), 'Work Sans': require(...) }
    if (!fontFiles) {
      console.warn("fontFiles is undefined, skipping font loading");
      return;
    }

    await Font.loadAsync(fontFiles);
    console.log(
      "Fonts loaded successfully with family names:",
      Object.keys(fontFiles)
    );
  } catch (error) {
    console.error("Error loading fonts:", error);
    throw error;
  }
};
