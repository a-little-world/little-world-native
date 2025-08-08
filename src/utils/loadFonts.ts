import * as Font from "expo-font";
import {
  fontFiles,
  fontFamilies,
} from "@a-little-world/little-world-design-system-core";

export const loadFonts = async (): Promise<void> => {
  try {
    // Map the fontFiles to use the correct font family names
    // TODO: fix this in the DS and then remove this mapping
    const fontsToLoad: { [key: string]: any } = {};

    // Use the fontFamilies mapping to get the correct names
    Object.entries(fontFiles).forEach(([key, fontFile]) => {
      const fontFamilyName = fontFamilies[key as keyof typeof fontFamilies];
      if (fontFamilyName) {
        fontsToLoad[fontFamilyName] = fontFile;
      }
    });

    await Font.loadAsync(fontsToLoad);
    console.log(
      "Fonts loaded successfully with family names:",
      Object.keys(fontsToLoad)
    );
  } catch (error) {
    console.error("Error loading fonts:", error);
    throw error;
  }
};
