'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { faqData, type FAQBook, type FAQSection } from './faqData';

/* ---------------------------------------------------------------------
 * Color palette & layout constants
 * (Kept as-is per your request)
 * ------------------------------------------------------------------- */
const palette = {
  deepBrown: '#3A0000',
  lightPeach: '#fff2eaff',
  backdrop: 'rgba(0,0,0,0.45)',
};
const BANNER_HEIGHT = 80;

/* ---------------------------------------------------------------------
 * Context setup
 * ------------------------------------------------------------------- */
type HelpContextValue = {
  open: (pageKey: keyof FAQBook, anchorId?: string) => void;
  close: () => void;
};
const HelpContext = createContext<HelpContextValue | null>(null);

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error('useHelp() must be used inside <HelpProvider>');
  return ctx;
}

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [pageKey, setPageKey] = useState<keyof FAQBook | null>(null);
  const [anchorId, setAnchorId] = useState<string | undefined>(undefined);

  const open = useCallback((key: keyof FAQBook, anchor?: string) => {
    setPageKey(key);
    setAnchorId(anchor);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // ESC to close + lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  return (
    <HelpContext.Provider value={{ open, close }}>
      {children}
      {isOpen && pageKey && (
        <HelpPanelOverlay pageKey={pageKey} anchorId={anchorId} onClose={close} />
      )}
    </HelpContext.Provider>
  );
}

/* ---------------------------------------------------------------------
 * Role aggregation helper
 * - Concatenates all pages under the same role (e.g. "family/*").
 * - Inserts a "page divider" (section with id="__page-divider__<pageKey>") before each page.
 * - Returns the divider id for the CURRENT page to pin the "Current page" badge.
 * ------------------------------------------------------------------- */
function buildRoleAggregated(
  pageKey: keyof FAQBook,
  anchorId?: string
): {
  title: string;
  sections: FAQSection[];
  defaultScrollId?: string;
  currentPageDividerId: string; // divider anchor for the opened page
} {
  const [role] = String(pageKey).split('/', 1) as ['family' | 'carer' | 'management' | string];
  const rolePrefix = `${role}/`;

  const pages = Object.entries(faqData)
    .filter(([k]) => k.startsWith(rolePrefix))
    .map(([k, v]) => ({ key: k as keyof FAQBook, page: v }));

  const currentFirstSectionId = faqData[pageKey]?.sections?.[0]?.id ?? undefined;

  const roleLabel =
    role === 'family'
      ? 'Family / POA'
      : role === 'carer'
      ? 'Carer'
      : role === 'management'
      ? 'Management'
      : 'Help';

  // Strip role prefix from page titles
  const cleanTitle = (t: string) =>
    t.replace(/^Family\s*\/\s*POA\s*—\s*/i, '')
      .replace(/^Carer\s*—\s*/i, '')
      .replace(/^Management\s*—\s*/i, '')
      .trim();

  const sections: FAQSection[] = [];
  pages.forEach(({ key, page }) => {
    sections.push({
      id: `__page-divider__${key}`, // page-level anchor
      title: cleanTitle(page.title),
    });
    sections.push(...(page.sections ?? []));
  });

  return {
    title: `${roleLabel} — FAQs`,
    sections,
    defaultScrollId: anchorId || currentFirstSectionId,
    currentPageDividerId: `__page-divider__${pageKey}`,
  };
}

/* ---------------------------------------------------------------------
 * Q/A parser
 * - Parse section.body (string | string[]) into Q/A pairs.
 * - Accept "Q:" / "A:" or "Q：" / "A：" (full-width colon), case-insensitive.
 * - Non Q/A-prefixed lines are treated as answer continuation.
 * ------------------------------------------------------------------- */
type QAPair = { q: string; a: string[] };

function parseQAPairs(body?: string | string[]): QAPair[] {
  if (!body) return [];
  const lines = (Array.isArray(body) ? body : [body])
    .map((s) => String(s).trim())
    .filter(Boolean);

  const qa: QAPair[] = [];
  let current: QAPair | null = null;

  const qRe = /^q[:：]\s*/i;
  const aRe = /^a[:：]\s*/i;

  for (const line of lines) {
    if (qRe.test(line)) {
      // Start a new question
      const q = line.replace(qRe, '').trim();
      current = { q, a: [] };
      qa.push(current);
    } else if (aRe.test(line)) {
      // Append answer paragraph (or start if none)
      if (!current) {
        current = { q: '', a: [] };
        qa.push(current);
      }
      current.a.push(line.replace(aRe, '').trim());
    } else if (current) {
      // Continuation of answer
      current.a.push(line);
    }
  }
  return qa;
}

/* ---------------------------------------------------------------------
 * HelpPanelOverlay
 * - Independent scrolling: LEFT (TOC) and RIGHT (content).
 * - LEFT TOC shows ONE BIG ITEM PER PAGE ONLY (the page divider).
 * - "Current page" badge is permanently pinned to the opened page's divider.
 * - Highlight starts on the "Current page" divider and then follows user clicks.
 * - No scroll-driven highlight (prevents flicker).
 * ------------------------------------------------------------------- */
function HelpPanelOverlay({
  pageKey,
  anchorId,
  onClose,
}: {
  pageKey: keyof FAQBook;
  anchorId?: string;
  onClose: () => void;
}) {
  const { title, sections, defaultScrollId, currentPageDividerId } = useMemo(
    () => buildRoleAggregated(pageKey, anchorId),
    [pageKey, anchorId]
  );

  // Right content scroll container (independent scroll)
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll RIGHT content to target (anchor or first section of the page)
  useEffect(() => {
    if (!defaultScrollId) return;
    const el = document.getElementById(defaultScrollId);
    if (el) {
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => window.clearTimeout(t);
    }
  }, [defaultScrollId]);

  // Build LEFT TOC with ONLY page dividers (one entry per page)
  const toc = useMemo(
    () =>
      sections
        .filter((s) => s.id.startsWith('__page-divider__'))
        .map((s) => ({ id: s.id, title: s.title })),
    [sections]
  );

  // LEFT highlight state:
  // - initial = CURRENT PAGE divider
  // - open() different page resets to that divider
  const [selectedId, setSelectedId] = useState<string | undefined>(currentPageDividerId);
  useEffect(() => {
    setSelectedId(currentPageDividerId);
  }, [currentPageDividerId]);

  // Clicking a TOC item: scroll RIGHT content to divider & delay highlight to avoid jank
  const handleJump = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => setSelectedId(id), 120);
  }, []);

  return createPortal(
    <>
      {/* Backdrop (full screen, intercepts clicks) */}
      <div
        onClick={onClose}
        aria-hidden
        className="fixed inset-0 transition-opacity"
        style={{ background: palette.backdrop, zIndex: 1000 }}
      />

      {/* Drawer (bottom-up; height limited to keep banner visible) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-0 right-0 bottom-0 z-[1001] flex flex-col rounded-t-2xl shadow-xl will-change-transform"
        style={{
          maxHeight: `min(760px, calc(100vh - ${BANNER_HEIGHT}px - 16px))`,
          height: `min(760px, calc(100vh - ${BANNER_HEIGHT}px - 16px))`,
          background: palette.lightPeach,
          color: palette.deepBrown,
          animation: 'faq-drawer-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Header (deep-brown background, white text) */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-3 border-b"
          style={{
            borderColor: palette.deepBrown,
            background: palette.deepBrown,
          }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: 'white' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close help"
            className="rounded-full px-2 text-3xl leading-none hover:opacity-75"
            style={{ color: 'white' }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Grid container (parent not scrollable; columns scroll independently) */}
        <div
          className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 sm:gap-6 px-5 sm:px-6 py-4 overflow-hidden"
          style={{ height: 'calc(100% - 56px)', color: palette.deepBrown }}
        >
          {/* ======================= TOC (LEFT, own scroll) ======================= */}
          {/* >>> LEFT sidebar is kept EXACTLY as your version (no changes) <<< */}
          <nav className="hidden md:block h-full overflow-y-auto self-stretch">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(58,0,0,0.10)', // darker panel for directory look
                minHeight: '140vh',     
              }}
            >
              {/* No heading per your request; TOC = one big item per page */}
              <ul className="flex flex-col gap-5">
                {toc.map((item) => {
                  const isSelected = item.id === selectedId;
                  const isCurrent = item.id === currentPageDividerId; // where "Current page" badge is pinned
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleJump(item.id)}
                        className="block w-full text-left no-underline"
                        style={{
                          color: isSelected ? '#fff' : palette.deepBrown,
                          background: isSelected ? palette.deepBrown : 'rgba(58,0,0,0.08)',
                          borderRadius: 16,
                          padding: '16px 18px',
                          lineHeight: 1.35,
                          fontSize: '1.22rem',
                          fontWeight: 400,
                          transition: 'background 140ms ease, color 140ms ease',
                        }}
                      >
                        {isCurrent && (
                          <div
                            className="mb-1"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: isSelected ? '#fff' : palette.deepBrown,
                              opacity: 0.95,
                            }}
                          >
                            <span>Current page</span>
                          </div>
                        )}
                        <div>{item.title}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* ======================= Sections (RIGHT, own scroll) ======================= */}
          <div ref={contentRef} className="space-y-8 h-full overflow-y-auto pr-1">
            {sections.map((s) => (
              <FAQSectionBlock key={s.id} section={s} />
            ))}
          </div>
        </div>
      </aside>

      {/* Slide-up animation + optional summary marker cleanup */}
      <style jsx global>{`
        @keyframes faq-drawer-in {
          from { transform: translateY(100%); }
          to   { transform: translateY(0%); }
        }
        /* Keep default marker if you like; uncomment below to hide:
        details > summary::-webkit-details-marker { display: none; }
        details > summary { list-style: none; }
        */
      `}</style>
    </>,
    document.body
  );
}

/* ---------------------------------------------------------------------
 * Single FAQ section (RIGHT column)
 * - Page divider: big header only (not collapsible).
 * - Normal section: parse Q/A and render as collapsible tiles (one question = one box).
 *   * Question in <summary> is bold
 *   * Answer paragraphs are hidden until expanded
 *   * Fallback: if no Q/A pattern, render plain paragraphs (unchanged)
 * ------------------------------------------------------------------- */
function FAQSectionBlock({ section }: { section: FAQSection }) {
  const isDivider = section.id.startsWith('__page-divider__');

  if (isDivider) {
    return (
      <section id={section.id} className="scroll-mt-24">
        <h3 className="text-xl md:text-2xl font-semibold mb-3" style={{ color: palette.deepBrown }}>
          {section.title}
        </h3>
      </section>
    );
  }

  const qaPairs = parseQAPairs(section.body);
  const hasQA = qaPairs.length > 0;


  return (
    <section id={section.id} className="scroll-mt-24">
      <h3 className="text-lg md:text-xl font-semibold mb-1" style={{ color: palette.deepBrown }}>
        {section.title}
      </h3>

      {section.subtitle && (
        <div className="text-base mb-2" style={{ color: palette.deepBrown }}>
          {section.subtitle}
        </div>
      )}

      {hasQA ? (
        <div className="space-y-4">
          {qaPairs.map((pair, idx) => (
            <details
              key={idx}
              className="rounded-xl"
              style={{
                background: 'rgba(58,0,0,0.06)',
                border: '1px solid rgba(58,0,0,0.15)',
                padding: '14px 16px',
              }}
            >
              <summary
                className="cursor-pointer select-none"
                style={{ color: palette.deepBrown }}
              >
                <span className="font-semibold">{pair.q || 'Question'}</span>
              </summary>
              <div className="mt-2 space-y-2" style={{ color: palette.deepBrown }}>
                {pair.a.length ? pair.a.map((p, i) => <p key={i}>{p}</p>) : <p>—</p>}
              </div>
            </details>
          ))}
        </div>
      ) : (
   
        (() => {
          const body = Array.isArray(section.body) ? section.body : section.body ? [section.body] : [];
          return body.length ? (
            <div className="space-y-3 leading-relaxed text-[1rem]" style={{ color: palette.deepBrown }}>
              {body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null;
        })()
      )}
    </section>
  );
}
