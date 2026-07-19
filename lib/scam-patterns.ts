/**
 * RAG-lite: a curated, trusted library of known Indian scam scripts.
 * Retrieval is a deterministic keyword match — the matched entries are
 * OUR OWN text (never user input), so injecting them into the prompt as
 * context is safe. Selection by untrusted input only picks from this whitelist.
 */
export type ScamPattern = { id: string; name: string; keywords: string[]; script: string };

export const scamPatterns: ScamPattern[] = [
  {
    id: "digital-arrest",
    name: "Digital arrest",
    keywords: ["digital arrest", "cbi", "police", "narcotics", "parcel", "aadhaar", "video call", "arrest warrant", "money laundering", "court"],
    script: "Caller poses as CBI/police/customs, claims a parcel or Aadhaar is linked to crime, demands a continuous video call, isolation ('do not tell anyone'), then a 'verification' money transfer. Police never arrest or verify funds by video call."
  },
  {
    id: "utility-video-call",
    name: "Utility bill video-call scam (gas/electricity)",
    keywords: ["gas", "mngl", "png", "pipeline", "electricity", "bill", "disconnect", "meter", "kyc update", "video call"],
    script: "Caller poses as gas/electricity official about a pending bill or KYC, often on video call, and walks the victim through 'authorizing' a small payment or app install that drains the account. Utility companies never collect via video call or personal UPI."
  },
  {
    id: "kyc-expiry",
    name: "Bank/SIM KYC expiry",
    keywords: ["kyc", "expire", "suspended", "blocked", "update immediately", "yono", "netbanking", "sim"],
    script: "Message claims KYC expires today and the account/SIM will be blocked; a short link leads to a fake bank page harvesting credentials/OTP. Banks never send KYC links by SMS."
  },
  {
    id: "fake-parcel",
    name: "Fake parcel / customs fee",
    keywords: ["fedex", "courier", "customs", "parcel", "clearance", "shipment", "held", "fee"],
    script: "A parcel is 'held at customs'; a small clearance fee via link captures card/UPI details, or escalates into digital arrest. Couriers do not collect customs fees via random links."
  },
  {
    id: "upi-collect",
    name: "UPI collect-request reversal",
    keywords: ["upi", "collect request", "cashback", "approve", "receive money", "refund"],
    script: "Victim is told to APPROVE a collect request to RECEIVE money. Approving a UPI collect request always SENDS money. Nobody needs your approval or PIN to send you money."
  },
  {
    id: "task-job",
    name: "Task/job scam",
    keywords: ["work from home", "earn daily", "telegram", "like videos", "task", "registration fee", "joining bonus", "part time"],
    script: "Easy daily earnings for likes/reviews; small fake payouts build trust, then a large 'deposit to withdraw'. Real employers never charge to give you a job."
  },
  {
    id: "loan-app",
    name: "Predatory loan app",
    keywords: ["instant loan", "loan approved", "no documents", "install", "permissions", "contacts", "cashnow"],
    script: "Instant loan requires installing an app with contacts/SMS permissions; data is used for harassment and blackmail regardless of repayment."
  },
  {
    id: "lottery",
    name: "Lottery / KBC prize",
    keywords: ["lottery", "kbc", "lucky draw", "won", "prize", "crorepati", "claim"],
    script: "Your number 'won' a huge prize; claiming requires fees/taxes paid upfront, often to a +92 WhatsApp number. Real lotteries never charge to release winnings."
  },
  {
    id: "investment",
    name: "Guaranteed-returns investment / trading group",
    keywords: ["guaranteed returns", "trading", "vip group", "sebi", "profit", "deposit", "stock tips", "crypto"],
    script: "A 'VIP' group shows fake profit screenshots and guarantees returns; deposits grow on a fake dashboard but can never be withdrawn. Guaranteed high returns are always fraud."
  },
  {
    id: "army-olx",
    name: "Fake army buyer/seller (OLX)",
    keywords: ["army", "cisf", "olx", "advance payment", "qr code", "scan to receive", "canteen"],
    script: "An 'army officer' buys/sells goods, sends a QR code to 'receive' payment — scanning a QR and entering PIN always SENDS money."
  }
];

/** Deterministic keyword retrieval: top-scoring patterns mentioned in the message. */
export function matchPatterns(message: string, limit = 3): ScamPattern[] {
  const haystack = message.toLowerCase();
  return scamPatterns
    .map((pattern) => ({
      pattern,
      score: pattern.keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map((entry) => entry.pattern);
}
