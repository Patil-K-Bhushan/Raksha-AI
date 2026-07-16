/**
 * Phone integration tripwires: installable PWA manifest, Android SMS
 * share-target, and the clipboard paste-and-scan flow.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

describe("PWA manifest", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest")) as {
    display: string;
    icons: Array<{ src: string }>;
    share_target?: { action: string; method: string; params: Record<string, string> };
  };

  it("is installable (standalone display + icons present on disk)", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of manifest.icons) {
      expect(existsSync(join(root, "public", icon.src)), `${icon.src} missing`).toBe(true);
    }
  });

  it("registers as an SMS share target (Share → Raksha from any messages app)", () => {
    expect(manifest.share_target).toBeDefined();
    expect(manifest.share_target!.method).toBe("GET");
    expect(manifest.share_target!.action).toBe("/");
    expect(manifest.share_target!.params.text).toBe("text");
  });
});

describe("app wiring", () => {
  it("layout links the manifest and mobile viewport", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain('manifest: "/manifest.webmanifest"');
    expect(layout).toContain("Viewport");
  });

  it("page forwards shared text into the analyzer", () => {
    const page = read("app/page.tsx");
    expect(page).toContain("searchParams");
    expect(page).toContain("sharedText");
  });

  it("analyzer auto-scans shared text exactly once and offers paste-and-scan", () => {
    const analyzer = read("app/scam-analyzer.tsx");
    expect(analyzer).toContain("sharedText");
    expect(analyzer).toContain("navigator.clipboard.readText");
    expect(analyzer).toContain("sharedHandled");
  });
});
