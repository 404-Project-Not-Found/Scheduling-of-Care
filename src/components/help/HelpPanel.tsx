'use client';

/**
 * Help Panel (Provider + Overlay) — Single Page per Role
 * - Right side: renders ONLY the active page (activeKey).
 * - Left sidebar: lists pages that share the same role as the page used to open the panel.
 * - The "Current page" badge is permanently pinned to the page that was open when the panel was opened (openedKeyRef).
 * - Sidebar auto-scroll keeps the active entry in view.
 * - Supports whitelist (allowedPageKeys) and anchor scrolling (sectionId).
 * - Search highlights matching text and filters questions within sections.
 */

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
 * Context
 * ------------------------------------------------------------------- */
export type HelpOpenOptions = {
  allowedPageKeys?: (keyof FAQBook)[];
};

type HelpContextValue = {
  isOpen: boolean;
  pageKey: keyof FAQBook | null;
  sectionId: string | null;
  allowedPageKeys?: (keyof FAQBook)[];
  open: (
    page: keyof FAQBook,
    anchorId?: string,
    opts?: HelpOpenOptions
  ) => void;
  close: () => void;
};

const HelpContext = createContext<HelpContextValue | null>(null);

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error('useHelp() must be used inside <HelpProvider>');
  return ctx;
}

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageKey, setPageKey] = useState<keyof FAQBook | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [allowedPageKeys, setAllowedPageKeys] = useState<
    (keyof FAQBook)[] | undefined
  >(undefined);

  const open = useCallback(
    (page: keyof FAQBook, anchor?: string, opts?: HelpOpenOptions) => {
      setPageKey(page);
      setSectionId(anchor ?? null);
      setAllowedPageKeys(opts?.allowedPageKeys);
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setAllowedPageKeys(undefined);
  }, []);

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

  const value = useMemo(
    () => ({ isOpen, pageKey, sectionId, allowedPageKeys, open, close }),
    [isOpen, pageKey, sectionId, allowedPageKeys, open, close]
  );

  return (
    <HelpContext.Provider value={value}>
      {children}
      {isOpen && pageKey && (
        <HelpPanelOverlay
          pageKey={pageKey}
          sectionId={sectionId ?? undefined}
          allowedPageKeys={allowedPageKeys}
          onClose={close}
        />
      )}
    </HelpContext.Provider>
  );
}

/* ---------------------------------------------------------------------
 * Utils
 * ------------------------------------------------------------------- */
const palette = {
  deepBrown: '#3A0000',
  lightPeach: '#fff2eaff',
  backdrop: 'rgba(0,0,0,0.45)',
};

function getRoleFromKey(
  k: keyof FAQBook
): 'family' | 'carer' | 'management' | 'other' {
  const [role] = String(k).split('/', 1);
  if (role === 'family' || role === 'carer' || role === 'management')
    return role;
  return 'other';
}

function cleanPageTitle(t: string) {
  return t
    .replace(/^Family\s*\/\s*POA\s*—\s*/i, '')
    .replace(/^Carer\s*—\s*/i, '')
    .replace(/^Management\s*—\s*/i, '')
    .trim();
}

function computeDefaultScrollId(key: keyof FAQBook, sectionId?: string) {
  const first = faqData[key]?.sections?.[0]?.id;
  return sectionId || first || `__page-divider__${key}`;
}

/* ---------------------------------------------------------------------
 * Q/A parser
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
      const q = line.replace(qRe, '').trim();
      current = { q, a: [] };
      qa.push(current);
    } else if (aRe.test(line)) {
      if (!current) current = { q: '', a: [] };
      current.a.push(line.replace(aRe, '').trim());
    } else if (current) {
      current.a.push(line);
    }
  }
  return qa;
}

/* ---------------------------------------------------------------------
 * Overlay (with search filtering for Q/A pairs)
 * ------------------------------------------------------------------- */
function HelpPanelOverlay({
  pageKey,
  sectionId,
  allowedPageKeys,
  onClose,
}: {
  pageKey: keyof FAQBook;
  sectionId?: string;
  allowedPageKeys?: (keyof FAQBook)[];
  onClose: () => void;
}) {
  // Dynamic active key state
  const [activeKey, setActiveKey] = useState<keyof FAQBook>(pageKey);
  const openedKeyRef = useRef<keyof FAQBook>(activeKey);

  useEffect(() => {
    openedKeyRef.current = activeKey;
  }, [activeKey]);

  const page = faqData[activeKey];
  const sections = page?.sections ?? [];
  const dividerId = `__page-divider__${activeKey}`;
  const defaultScrollId = computeDefaultScrollId(activeKey, sectionId);

  const contentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = document.getElementById(defaultScrollId);
    if (el) {
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => window.clearTimeout(t);
    }
  }, [defaultScrollId, activeKey]);

  const [selectedId, setSelectedId] = useState<string | undefined>(dividerId);
  useEffect(() => {
    setSelectedId(dividerId);
  }, [dividerId]);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = document.getElementById(`toc-${activeKey}`);
    if (el && sidebarRef.current)
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeKey]);

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => setSelectedId(id), 120);
  };

  // --- Dynamic role based on activeKey ---
  const currentRole = getRoleFromKey(activeKey);
  const roleKeys = (Object.keys(faqData) as (keyof FAQBook)[]).filter(
    (k) => getRoleFromKey(k) === currentRole
  );
  const visibleKeys =
    allowedPageKeys && allowedPageKeys.length
      ? roleKeys.filter((k) => allowedPageKeys.includes(k))
      : roleKeys;

  // --- Search state ---
  const [searchQuery, setSearchQuery] = useState('');

  // Compute filtered sections with matching Q/A
  const filteredSections: {
    section: FAQSection;
    matchedPairs?: QAPair[];
    pageTitle: string;
  }[] = [];
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    for (const key of Object.keys(faqData) as (keyof FAQBook)[]) {
      if (getRoleFromKey(key) !== currentRole) continue; // dynamic role filter
      const page = faqData[key];
      for (const section of page.sections ?? []) {
        const qaPairs = parseQAPairs(section.body);
        const matchedPairs = qaPairs.filter(
          (p) =>
            p.q.toLowerCase().includes(query) ||
            p.a.some((a) => a.toLowerCase().includes(query))
        );
        const sectionText = Array.isArray(section.body)
          ? section.body.join(' ')
          : (section.body ?? '');
        if (
          matchedPairs.length > 0 ||
          sectionText.toLowerCase().includes(query)
        ) {
          filteredSections.push({
            section,
            matchedPairs: matchedPairs.length ? matchedPairs : undefined,
            pageTitle: page.title,
          });
        }
      }
    }
  }

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden
        className="fixed inset-0 transition-opacity"
        style={{ background: palette.backdrop, zIndex: 1000 }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={page?.title ?? 'Help'}
        className="fixed left-0 right-0 bottom-0 z-[1001] flex flex-col rounded-t-2xl shadow-xl will-change-transform"
        style={{
          maxHeight: 'min(760px, calc(100vh - 80px - 16px))',
          height: 'min(760px, calc(100vh - 80px - 16px))',
          background: palette.lightPeach,
          color: palette.deepBrown,
          animation: 'faq-drawer-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Header & Search */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-3 border-b"
          style={{
            borderColor: palette.deepBrown,
            background: palette.deepBrown,
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-semibold"
            style={{ color: 'white' }}
          >
            {page?.title ? `${page.title} FAQs` : 'Help - FAQs'}
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="rounded-xl px-3 py-2 text-sm sm:text-base border border-white/40 focus:outline-none"
              style={{ background: 'white', color: palette.deepBrown }}
            />
            <button
              onClick={() => typeof window !== 'undefined' && window.print()}
              className="inline-flex items-center px-4 sm:px-5 py-2 rounded-2xl border border-white/40 bg-white font-semibold text-sm sm:text-base hover:bg-black/5 transition-colors"
              title="Print"
              aria-label="Print"
              style={{ color: palette.deepBrown }}
            >
              Print
            </button>
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
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 sm:gap-6 px-5 sm:px-6 py-4 overflow-hidden"
          style={{ height: 'calc(100% - 56px)', color: palette.deepBrown }}
        >
          <nav
            ref={sidebarRef}
            className="hidden md:block h-full overflow-y-auto self-stretch"
          >
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(58,0,0,0.10)', minHeight: '140vh' }}
            >
              <ul className="flex flex-col gap-5">
                {visibleKeys.map((key) => {
                  const id = `__page-divider__${key}`;
                  const isSelected = id === selectedId;
                  const isCurrent = key === openedKeyRef.current;
                  return (
                    <li key={key}>
                      <button
                        id={`toc-${key}`}
                        type="button"
                        onClick={() => {
                          setActiveKey(key);
                          requestAnimationFrame(() =>
                            handleJump(`__page-divider__${key}`)
                          );
                        }}
                        className="block w-full text-left no-underline"
                        style={{
                          color: isSelected ? '#fff' : palette.deepBrown,
                          background: isSelected
                            ? palette.deepBrown
                            : 'rgba(58,0,0,0.08)',
                          borderRadius: 16,
                          padding: '16px 18px',
                          lineHeight: 1.35,
                          fontSize: '1.18rem',
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
                        <div>{cleanPageTitle(faqData[key].title)}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <div
            ref={contentRef}
            className="space-y-8 h-full overflow-y-auto pr-1"
          >
            {searchQuery.trim() ? (
              <div className="space-y-6">
                {filteredSections.length ? (
                  filteredSections.map(
                    ({ section, matchedPairs, pageTitle }) => (
                      <div key={section.id}>
                        <h3
                          className="text-xl md:text-2xl font-semibold mb-3"
                          style={{ color: palette.deepBrown }}
                        >
                          {cleanPageTitle(pageTitle)}: {section.title}
                        </h3>
                        <FAQSectionBlock
                          section={section}
                          color={palette.deepBrown}
                          highlight={searchQuery}
                          filteredPairs={matchedPairs}
                        />
                      </div>
                    )
                  )
                ) : (
                  <p style={{ color: palette.deepBrown }}>No results found.</p>
                )}
              </div>
            ) : (
              <>
                <section id={dividerId} className="scroll-mt-24">
                  <h3
                    className="text-xl md:text-2xl font-semibold mb-3"
                    style={{ color: palette.deepBrown }}
                  >
                    {cleanPageTitle(page?.title ?? 'Help')}
                  </h3>
                </section>
                {(sections as FAQSection[]).map((s) => (
                  <FAQSectionBlock
                    key={s.id}
                    section={s}
                    color={palette.deepBrown}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes faq-drawer-in {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0%);
          }
        }
      `}</style>
    </>,
    document.body
  );
}

/* ---------------------------------------------------------------------
 * FAQ searcher that highlights searched text
 * ------------------------------------------------------------------- */
function FAQSectionBlock({
  section,
  color,
  highlight,
  filteredPairs,
}: {
  section: FAQSection;
  color: string;
  highlight?: string;
  filteredPairs?: QAPair[];
}) {
  const qaPairs = filteredPairs ?? parseQAPairs(section.body);
  const hasQA = qaPairs.length > 0;

  const highlightText = (text: string) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: 'yellow', color: 'inherit' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <section id={section.id} className="scroll-mt-24">
      <h3 className="text-lg md:text-xl font-semibold mb-1" style={{ color }}>
        {section.title}
      </h3>

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
              <summary className="cursor-pointer select-none" style={{ color }}>
                <span className="font-semibold">
                  {highlightText(pair.q || 'Question')}
                </span>
              </summary>
              <div className="mt-2 space-y-2" style={{ color }}>
                {pair.a.length ? (
                  pair.a.map((p, i) => <p key={i}>{highlightText(p)}</p>)
                ) : (
                  <p>—</p>
                )}
              </div>
            </details>
          ))}
        </div>
      ) : (
        (() => {
          const body = Array.isArray(section.body)
            ? section.body
            : section.body
              ? [section.body]
              : [];
          return body.length ? (
            <div
              className="space-y-3 leading-relaxed text-[1rem]"
              style={{ color }}
            >
              {body.map((p, i) => (
                <p key={i}>{highlightText(p)}</p>
              ))}
            </div>
          ) : null;
        })()
      )}
    </section>
  );
}
