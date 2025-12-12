import { Asset } from "expo-asset";
import { fontFiles } from "@a-little-world/little-world-design-system-core";

const CHUNK_SIZE = 8192; // Optimal chunk size for base64 conversion
const RETRY_DELAY = 100; // Delay before retry in milliseconds

/**
 * Converts ArrayBuffer to base64 string in chunks to avoid call stack overflow
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binaryString = "";

  for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
    const chunk = uint8Array.subarray(i, i + CHUNK_SIZE);
    binaryString += String.fromCharCode(...chunk);
  }

  return btoa(binaryString);
}

/**
 * Determines font format from file extension
 */
function getFontFormat(url: string): string {
  if (url.endsWith(".woff2")) return "woff2";
  if (url.endsWith(".woff")) return "woff";
  if (url.endsWith(".ttf")) return "truetype";
  return "truetype"; // Default fallback
}

/**
 * Processes a single font asset and generates its @font-face CSS rule
 */
async function processFontAsset(
  fontFamily: string,
  fontAsset: any
): Promise<string | null> {
  try {
    // Load and download the asset
    const asset = Asset.fromModule(fontAsset as any);
    await asset.downloadAsync();

    const fontUrl = asset.localUri || asset.uri;
    if (!fontUrl) {
      return null;
    }

    // Fetch the font file
    const response = await fetch(fontUrl);
    if (!response.ok) {
      return null;
    }

    // Convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const format = getFontFormat(fontUrl);

    // Generate @font-face CSS rule
    return `
      @font-face {
        font-family: '${fontFamily}';
        src: url(data:font/${format};base64,${base64}) format('${format}');
        font-display: swap;
      }
    `;
  } catch (error) {
    console.error(
      `[DOM Font Injection] Error processing ${fontFamily}:`,
      error
    );
    return null;
  }
}

/**
 * Generates @font-face CSS rules for all fonts
 * Processes fonts in parallel for better performance
 */
async function generateFontFaceCSS(): Promise<string> {
  if (!fontFiles) {
    return "";
  }

  const fontEntries = Object.entries(fontFiles);

  // Process all fonts in parallel for better performance
  const fontFaceRules = await Promise.all(
    fontEntries.map(([fontFamily, fontAsset]) =>
      processFontAsset(fontFamily, fontAsset)
    )
  );

  // Filter out null results (failed fonts) and join
  const css = fontFaceRules
    .filter((rule): rule is string => rule !== null)
    .join("\n");

  return css;
}

/**
 * Injects fonts into the DOM WebView by adding @font-face rules to <head>
 */
export async function injectFontsIntoDOM(): Promise<() => void> {
  try {
    if (!document.head) {
      return () => {};
    }

    const fontCSS = await generateFontFaceCSS();

    if (!fontCSS) {
      return () => {};
    }

    // Remove existing injection if present
    const existing = document.head.querySelector("[data-font-injection]");
    if (existing) {
      existing.remove();
    }

    // Inject new style element
    const style = document.createElement("style");
    style.textContent = fontCSS;
    style.setAttribute("data-font-injection", "true");
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  } catch (error) {
    console.error("[DOM Font Injection] Injection error:", error);
    return () => {};
  }
}

/**
 * Applies font injection with retry logic for cases where DOM isn't ready
 */
export function applyFontInjectionWithRetry(
  retryDelay: number = RETRY_DELAY
): () => void {
  let cleanup: (() => void) | null = null;

  const tryApply = async () => {
    try {
      cleanup = await injectFontsIntoDOM();
    } catch (error) {
      console.error("[DOM Font Injection] Retry error:", error);
    }
  };

  // Try immediately
  tryApply();

  // Retry after delay if injection didn't succeed
  const timeoutId = setTimeout(() => {
    if (
      document.head &&
      !document.head.querySelector("[data-font-injection]")
    ) {
      tryApply();
    }
  }, retryDelay);

  return () => {
    clearTimeout(timeoutId);
    cleanup?.();
  };
}
