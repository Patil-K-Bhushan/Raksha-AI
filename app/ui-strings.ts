import type { UILanguage } from "@/lib/scam-analysis";

/**
 * Every visible string in the app, in all three languages. The toggle
 * switches the WHOLE interface — an elderly user should never meet an
 * English label they didn't choose. tests/ui-strings.test.ts enforces
 * that all three languages define exactly the same keys, so a missing
 * translation fails CI instead of failing on stage.
 */
export type UIStrings = {
  tagline: string;
  subtitle: string;
  tabSingle: string;
  tabInbox: string;
  tabCall: string;
  tabPractice: string;
  placeholder: string;
  privacy: string;
  analyze: string;
  analyzing: string;
  screenshot: string;
  voiceNote: string;
  pasteScan: string;
  tryExample: string;
  phoneTitle: string;
  phoneBody: string;
  verdictLabel: string;
  quickCheck: string;
  confidence: string;
  grandmaLabel: string;
  trapMap: string;
  trapMapSub: string;
  whatNext: string;
  oneAction: string;
  askTitle: string;
  askExample: string;
  askPlaceholder: string;
  askButton: string;
  askThinking: string;
  checking: string;
  verdictReady: string;
  warnFamily: string;
  complaintDraft: string;
  complaintTitle: string;
  complaintSub: string;
  copy: string;
  inboxIntro: string;
  inboxPlaceholder: string;
  scanDemo: string;
  scanMessages: string;
  scanningButton: string;
  emptyTitle: string;
  emptyLegend: string;
  scannedOf: string;
  scanningOf: string;
  queued: string;
  scanningRow: string;
  failedRetry: string;
  briefingWriting: string;
  briefingLabel: string;
  simIntro: string;
  simNote: string;
  surpriseMe: string;
  generate: string;
  generateAgain: string;
  generating: string;
  practiceLabel: string;
  reveal: string;
  simEmptyTitle: string;
  simEmptySub: string;
  pasteFirst: string;
};

export const uiStrings: Record<UILanguage, UIStrings> = {
  en: {
    tagline: "Scam autopsy, not scam detection.",
    subtitle: "Paste a suspicious message. Raksha shows the traps before they work.",
    tabSingle: "Message",
    tabInbox: "Inbox scan",
    tabCall: "Call Guard",
    tabPractice: "Practice",
    placeholder: "Paste an SMS, WhatsApp forward, email, or offer here...",
    privacy: "Nothing is stored. No account. Analyzed and discarded.",
    analyze: "Analyze message",
    analyzing: "Analyzing…",
    screenshot: "📷 Screenshot",
    voiceNote: "🎤 Voice note",
    pasteScan: "📋 Paste & scan",
    tryExample: "Or try an instant example",
    phoneTitle: "📱 On your phone",
    phoneBody: "Install Raksha from your browser menu (“Add to Home Screen”). Then in any SMS or WhatsApp message tap Share → Raksha and the scan starts instantly. Or copy a message and tap “Paste & scan”.",
    verdictLabel: "Verdict",
    quickCheck: "Quick check",
    confidence: "% confidence",
    grandmaLabel: "Grandma Mode",
    trapMap: "Trap Map",
    trapMapSub: "Tap a highlighted phrase to see how it manipulates you.",
    whatNext: "What happens next",
    oneAction: "One clear action",
    askTitle: "Ask about this message",
    askExample: "For example: “Why is this fake? The number looked real.”",
    askPlaceholder: "Ask a follow-up…",
    askButton: "Ask Raksha",
    askThinking: "Thinking…",
    checking: "Checking the message and mapping its tactics…",
    verdictReady: "Verdict is ready. The detailed Trap Map is still loading…",
    warnFamily: "⚠️ Warn your family",
    complaintDraft: "📝 Complaint draft",
    complaintTitle: "Ready-to-file complaint",
    complaintSub: "Paste this at cybercrime.gov.in and fill in the blanks.",
    copy: "Copy",
    inboxIntro: "Paste several messages at once — separate them with a blank line — and Raksha triages your whole inbox like a spam folder.",
    inboxPlaceholder: "Paste multiple messages here…\n\nSeparate each message with a blank line.",
    scanDemo: "Scan demo inbox",
    scanMessages: "Scan messages",
    scanningButton: "Scanning…",
    emptyTitle: "Your triaged inbox will appear here.",
    emptyLegend: "Red = scam · Yellow = suspicious · Green = likely safe (stay cautious)",
    scannedOf: "Scanned",
    scanningOf: "Scanning",
    queued: "Queued",
    scanningRow: "Scanning…",
    failedRetry: "Failed — tap to retry",
    briefingWriting: "Raksha is writing your inbox briefing…",
    briefingLabel: "Guardian briefing · threat level",
    simIntro: "Raksha writes a practice scam. Read it, spot the traps yourself, then reveal the Trap Map to check your instincts.",
    simNote: "Training example only — fictional sender, fake links, no real brands.",
    surpriseMe: "Surprise me",
    generate: "Generate a practice scam",
    generateAgain: "Try another one",
    generating: "Writing a practice scam…",
    practiceLabel: "Practice message",
    reveal: "I've spotted the traps — reveal the Trap Map",
    simEmptyTitle: "Your practice message will appear here.",
    simEmptySub: "Spot the traps before Raksha shows them.",
    pasteFirst: "Paste a message first."
  },
  hi: {
    tagline: "सिर्फ scam detection नहीं — पूरा पोस्टमॉर्टम।",
    subtitle: "संदिग्ध message paste करें। Raksha जाल पहले ही दिखा देगा।",
    tabSingle: "Message",
    tabInbox: "Inbox जांच",
    tabCall: "Call Guard",
    tabPractice: "अभ्यास",
    placeholder: "SMS, WhatsApp forward, email या offer यहां paste करें...",
    privacy: "कुछ भी save नहीं होता। कोई account नहीं। जांच के बाद delete।",
    analyze: "Message जांचें",
    analyzing: "जांच हो रही है…",
    screenshot: "📷 Screenshot",
    voiceNote: "🎤 Voice note",
    pasteScan: "📋 Paste करके जांचें",
    tryExample: "या तुरंत एक उदाहरण देखें",
    phoneTitle: "📱 अपने phone पर",
    phoneBody: "Browser menu से Raksha install करें (“Add to Home Screen”)। फिर किसी भी SMS या WhatsApp message में Share → Raksha दबाएं — जांच अपने आप शुरू। या message copy करके “Paste करके जांचें” दबाएं।",
    verdictLabel: "नतीजा",
    quickCheck: "तुरंत जांच",
    confidence: "% भरोसा",
    grandmaLabel: "Grandma Mode",
    trapMap: "जाल का नक्शा",
    trapMapSub: "Highlight किए शब्द दबाएं — पता चलेगा वे कैसे फंसाते हैं।",
    whatNext: "आगे क्या होगा",
    oneAction: "एक साफ कदम",
    askTitle: "इस message के बारे में पूछें",
    askExample: "जैसे: “यह नकली क्यों है? नंबर तो असली लगा।”",
    askPlaceholder: "सवाल पूछें…",
    askButton: "Raksha से पूछें",
    askThinking: "सोच रहा हूं…",
    checking: "Message की जांच और जाल की पहचान हो रही है…",
    verdictReady: "नतीजा तैयार है। पूरा नक्शा बन रहा है…",
    warnFamily: "⚠️ परिवार को बताएं",
    complaintDraft: "📝 शिकायत draft",
    complaintTitle: "तैयार शिकायत",
    complaintSub: "इसे cybercrime.gov.in पर paste करें और खाली जगह भरें।",
    copy: "Copy",
    inboxIntro: "कई message एक साथ paste करें — बीच में खाली line छोड़ें — Raksha पूरा inbox spam folder की तरह छांट देगा।",
    inboxPlaceholder: "कई message यहां paste करें…\n\nहर message के बीच खाली line छोड़ें।",
    scanDemo: "Demo inbox जांचें",
    scanMessages: "Message जांचें",
    scanningButton: "जांच जारी…",
    emptyTitle: "छांटा हुआ inbox यहां दिखेगा।",
    emptyLegend: "लाल = scam · पीला = संदिग्ध · हरा = शायद ठीक (सतर्क रहें)",
    scannedOf: "जांचे गए",
    scanningOf: "जांच जारी",
    queued: "कतार में",
    scanningRow: "जांच जारी…",
    failedRetry: "असफल — दोबारा दबाएं",
    briefingWriting: "Raksha आपके inbox की report लिख रहा है…",
    briefingLabel: "Guardian report · खतरे का स्तर",
    simIntro: "Raksha एक नकली scam लिखेगा। पढ़ें, खुद जाल पहचानें, फिर नक्शा खोलकर जांचें।",
    simNote: "सिर्फ अभ्यास के लिए — नकली sender, नकली link, कोई असली brand नहीं।",
    surpriseMe: "कोई भी चुनें",
    generate: "अभ्यास scam बनाएं",
    generateAgain: "एक और बनाएं",
    generating: "अभ्यास scam लिखा जा रहा है…",
    practiceLabel: "अभ्यास message",
    reveal: "मैंने जाल पहचान लिए — नक्शा दिखाएं",
    simEmptyTitle: "अभ्यास message यहां दिखेगा।",
    simEmptySub: "Raksha के दिखाने से पहले जाल खुद पहचानें।",
    pasteFirst: "पहले message paste करें।"
  },
  mr: {
    tagline: "फक्त scam detection नाही — पूर्ण पोस्टमॉर्टेम.",
    subtitle: "संशयास्पद message paste करा. Raksha सापळे आधीच दाखवेल.",
    tabSingle: "Message",
    tabInbox: "Inbox तपासणी",
    tabCall: "Call Guard",
    tabPractice: "सराव",
    placeholder: "SMS, WhatsApp forward, email किंवा offer इथे paste करा...",
    privacy: "काहीही save होत नाही. Account नाही. तपासणीनंतर delete.",
    analyze: "Message तपासा",
    analyzing: "तपासणी सुरू…",
    screenshot: "📷 Screenshot",
    voiceNote: "🎤 Voice note",
    pasteScan: "📋 Paste करून तपासा",
    tryExample: "किंवा लगेच एक उदाहरण पहा",
    phoneTitle: "📱 तुमच्या phone वर",
    phoneBody: "Browser menu मधून Raksha install करा (“Add to Home Screen”). मग कोणत्याही SMS किंवा WhatsApp message मध्ये Share → Raksha दाबा — तपासणी लगेच सुरू. किंवा message copy करून “Paste करून तपासा” दाबा.",
    verdictLabel: "निकाल",
    quickCheck: "झटपट तपासणी",
    confidence: "% खात्री",
    grandmaLabel: "Grandma Mode",
    trapMap: "सापळ्यांचा नकाशा",
    trapMapSub: "Highlight केलेले शब्द दाबा — ते कसे फसवतात ते कळेल.",
    whatNext: "पुढे काय होईल",
    oneAction: "एक स्पष्ट पाऊल",
    askTitle: "या message बद्दल विचारा",
    askExample: "उदा.: “हे खोटे का? नंबर तर खरा वाटला.”",
    askPlaceholder: "प्रश्न विचारा…",
    askButton: "Raksha ला विचारा",
    askThinking: "विचार करतोय…",
    checking: "Message ची तपासणी आणि सापळ्यांची ओळख सुरू…",
    verdictReady: "निकाल तयार आहे. पूर्ण नकाशा बनतोय…",
    warnFamily: "⚠️ कुटुंबाला सांगा",
    complaintDraft: "📝 तक्रार draft",
    complaintTitle: "तयार तक्रार",
    complaintSub: "हे cybercrime.gov.in वर paste करा आणि रिकाम्या जागा भरा.",
    copy: "Copy",
    inboxIntro: "अनेक message एकत्र paste करा — मध्ये रिकामी ओळ सोडा — Raksha पूर्ण inbox spam folder सारखा वर्गीकृत करेल.",
    inboxPlaceholder: "अनेक message इथे paste करा…\n\nप्रत्येक message मध्ये रिकामी ओळ सोडा.",
    scanDemo: "Demo inbox तपासा",
    scanMessages: "Message तपासा",
    scanningButton: "तपासणी सुरू…",
    emptyTitle: "वर्गीकृत inbox इथे दिसेल.",
    emptyLegend: "लाल = scam · पिवळा = संशयास्पद · हिरवा = बहुधा ठीक (सावध रहा)",
    scannedOf: "तपासले",
    scanningOf: "तपासणी सुरू",
    queued: "रांगेत",
    scanningRow: "तपासणी सुरू…",
    failedRetry: "अयशस्वी — पुन्हा दाबा",
    briefingWriting: "Raksha तुमच्या inbox ची report लिहितोय…",
    briefingLabel: "Guardian report · धोक्याची पातळी",
    simIntro: "Raksha एक सराव scam लिहील. वाचा, स्वतः सापळे ओळखा, मग नकाशा उघडून तपासा.",
    simNote: "फक्त सरावासाठी — खोटा sender, खोट्या link, खरे brand नाहीत.",
    surpriseMe: "काहीही निवडा",
    generate: "सराव scam बनवा",
    generateAgain: "आणखी एक",
    generating: "सराव scam लिहिला जातोय…",
    practiceLabel: "सराव message",
    reveal: "मी सापळे ओळखले — नकाशा दाखवा",
    simEmptyTitle: "सराव message इथे दिसेल.",
    simEmptySub: "Raksha दाखवण्याआधी सापळे स्वतः ओळखा.",
    pasteFirst: "आधी message paste करा."
  }
};

export function getStrings(language: UILanguage): UIStrings {
  return uiStrings[language];
}
