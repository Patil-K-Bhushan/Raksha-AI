import ScamAnalyzer from "./scam-analyzer";

type SearchParams = { text?: string; title?: string; url?: string };

/**
 * Android share-target entry point: once Raksha is installed from the
 * browser, "Share" from any SMS/WhatsApp app lands here as ?text=…
 * and the message is analyzed immediately.
 */
export default function Home({ searchParams }: { searchParams?: SearchParams }) {
  const shared = [searchParams?.title, searchParams?.text, searchParams?.url]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n")
    .trim();

  return <ScamAnalyzer sharedText={shared || undefined} />;
}
