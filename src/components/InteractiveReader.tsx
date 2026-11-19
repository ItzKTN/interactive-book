"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Headphones,
  List,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Presentation,
  Sparkles,
  Timer,
  Volume2,
  X,
} from "lucide-react";
import { BookBlock, Chapter, ChoiceOption, FootnoteItem } from "@/types/book";
import Navbar from "./Navbar";

interface InteractiveReaderProps {
  initialChapter: Chapter;
  allChapters: Chapter[];
  bookTitle: string;
  bookAuthor: string;
}

type ViewMode = "presentation" | "textbook";
type FlipState = "idle" | "next" | "prev";

const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
];

const FALLBACK_EMPTY_CHAPTER: Chapter = {
  id: "empty-fallback",
  slug: "stranitsa-1",
  title: "",
  subtitle: "",
  order: 1,
  status: "published",
  readingTimeMinutes: 1,
  blocks: [],
  footnotes: [],
  createdAt: "",
  updatedAt: "",
};

export default function InteractiveReader({
  initialChapter,
  allChapters,
  bookTitle,
  bookAuthor,
}: InteractiveReaderProps) {
  const safeInitial = initialChapter || allChapters[0] || FALLBACK_EMPTY_CHAPTER;
  const [chapter, setChapter] = useState<Chapter>(safeInitial);
  const [peelingChapter, setPeelingChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>(
    allChapters.length > 0 ? allChapters : [safeInitial]
  );

  // View Mode: "presentation" (Слайд летопис) or "textbook" (Разтворен учебник)
  const [viewMode, setViewMode] = useState<ViewMode>("presentation");
  // Mobile sub-mode for Textbook on screens < lg ("both" shows Left + Right with divider, or single "left" / "right")
  const [mobileTextbookTab, setMobileTextbookTab] = useState<
    "both" | "left" | "right"
  >("both");

  // Realistic 3D Page Turn state
  const [flipState, setFlipState] = useState<FlipState>("idle");
  const isFlippingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Auto-Play (Автоматично сменяне на слайдове) state
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySeconds, setAutoPlaySeconds] = useState<number>(8);
  const [autoPlayProgress, setAutoPlayProgress] = useState<number>(0);

  // Fullscreen / Zen & TOC Drawer
  const [zenMode, setZenMode] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  // Collapsible blocks state
  const [openCollapsibles, setOpenCollapsibles] = useState<
    Record<string, boolean>
  >({});

  // Toggleable Footnotes state
  const [activeFootnote, setActiveFootnote] = useState<FootnoteItem | null>(
    null
  );
  const [showAllFootnotes, setShowAllFootnotes] = useState(true);

  // Audio Narrator Widget state
  const [narratorOpen, setNarratorOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    caption?: string;
  } | null>(null);

  const initChapterCollapsibles = useCallback((ch?: Chapter) => {
    if (!ch || !Array.isArray(ch.blocks)) return;
    const initialCollapsibles: Record<string, boolean> = {};
    ch.blocks.forEach((b) => {
      if (b.type === "collapsible" && b.defaultOpen !== false) {
        initialCollapsibles[b.id] = true;
      }
    });
    setOpenCollapsibles(initialCollapsibles);
  }, []);

  useEffect(() => {
    const nextCh = initialChapter || allChapters[0] || FALLBACK_EMPTY_CHAPTER;
    setChapter(nextCh);
    setChapters(allChapters.length > 0 ? allChapters : [nextCh]);
    initChapterCollapsibles(nextCh);

    fetch("/api/chapters", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.chapters && data.chapters.length > 0) {
          setChapters(data.chapters);
          const matched =
            data.chapters.find((c: Chapter) => c.slug === nextCh.slug) ||
            data.chapters[0];
          setChapter(matched);
          initChapterCollapsibles(matched);
        }
      })
      .catch(() => {});
  }, [initialChapter, allChapters, initChapterCollapsibles]);

  const currentIdx = chapters.findIndex((c) => c.slug === chapter?.slug);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx >= 0 && currentIdx < chapters.length - 1
      ? chapters[currentIdx + 1]
      : null;

  // Realistic 3D Page Turn Transition
  const navigateToChapterWithFlip = useCallback(
    (targetSlug: string, explicitDirection?: "next" | "prev") => {
      if (isFlippingRef.current) return;
      const targetIdx = chapters.findIndex((c) => c.slug === targetSlug);
      if (targetIdx === -1 || targetSlug === chapter?.slug) return;

      const targetChapter = chapters[targetIdx];
      const direction: "next" | "prev" =
        explicitDirection || (targetIdx > currentIdx ? "next" : "prev");

      isFlippingRef.current = true;
      setPeelingChapter(chapter);
      setChapter(targetChapter);
      initChapterCollapsibles(targetChapter);
      setFlipState(direction);
      setActiveFootnote(null);
      setAutoPlayProgress(0);

      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `/${targetChapter.slug}`);
      }

      setTimeout(() => {
        setFlipState("idle");
        setPeelingChapter(null);
        isFlippingRef.current = false;
      }, 1090);
    },
    [chapters, chapter, currentIdx, initChapterCollapsibles]
  );

  // Auto-Play Timer Effect (Автоматично сменяне на слайдове)
  useEffect(() => {
    if (!autoPlay) {
      setAutoPlayProgress(0);
      return;
    }

    const tickMs = 100;
    const totalMs = autoPlaySeconds * 1000;
    let elapsed = 0;

    const interval = setInterval(() => {
      if (isFlippingRef.current) return;
      elapsed += tickMs;
      const pct = Math.min(100, (elapsed / totalMs) * 100);
      setAutoPlayProgress(pct);

      if (elapsed >= totalMs) {
        elapsed = 0;
        if (nextChapter) {
          navigateToChapterWithFlip(nextChapter.slug, "next");
        } else if (chapters.length > 0) {
          navigateToChapterWithFlip(chapters[0].slug, "next");
        }
      }
    }, tickMs);

    return () => clearInterval(interval);
  }, [
    autoPlay,
    autoPlaySeconds,
    nextChapter,
    chapters,
    navigateToChapterWithFlip,
  ]);

  // Keyboard arrow navigation between slides/pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowRight") {
        if (nextChapter) {
          navigateToChapterWithFlip(nextChapter.slug, "next");
        } else if (chapters.length > 0) {
          navigateToChapterWithFlip(chapters[0].slug, "next");
        }
      } else if (e.key === "ArrowLeft" && prevChapter) {
        navigateToChapterWithFlip(prevChapter.slug, "prev");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextChapter, prevChapter, chapters, navigateToChapterWithFlip]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [chapter?.slug]);

  const toggleNarratorPlay = () => {
    if (chapter.narratorAudioUrl) {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const plainText =
          chapter.narratorTranscript ||
          [
            chapter.title,
            chapter.subtitle,
            ...chapter.blocks
              .filter(
                (b) =>
                  b.type === "paragraph" ||
                  b.type === "heading" ||
                  b.type === "quote"
              )
              .map((b) => b.content.replace(/<[^>]+>/g, "")),
          ]
            .filter(Boolean)
            .join(". ");

        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = "bg-BG";
        utterance.rate = playbackRate;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const handleChoiceSelect = (choice: ChoiceOption) => {
    if (choice.targetSlug) {
      navigateToChapterWithFlip(choice.targetSlug);
    }
  };

  const renderRichHtmlWithFootnotes = (
    html: string,
    footnotesList?: FootnoteItem[]
  ) => {
    const fnSource = footnotesList || chapter.footnotes;
    const parts = html.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const fnNum = parseInt(match[1], 10);
        const fn = fnSource?.find((f) => f.number === fnNum);
        return (
          <button
            key={idx}
            type="button"
            onClick={() =>
              setActiveFootnote(
                activeFootnote?.number === fnNum
                  ? null
                  : fn || {
                      id: `fn-${fnNum}`,
                      number: fnNum,
                      label: String(fnNum),
                      content: `Бележка под линия [${fnNum}].`,
                    }
              )
            }
            className="mx-0.5 inline-flex -translate-y-1 items-center border border-[#7c1d12] bg-[#e8d5b0] px-1.5 py-0.2 font-serif text-[11px] font-bold text-[#6e1a12] shadow-sm transition hover:bg-[#6e1a12] hover:text-[#f7efde]"
            title="Покажи архивна бележка"
          >
            [{fnNum}]
          </button>
        );
      }
      return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  const renderBlockItem = (
    block: BookBlock,
    compactForTextbook = false,
    footnotesList?: FootnoteItem[],
    isFirstParagraph = false
  ) => {
    const alignClass =
      block.align === "center"
        ? "text-center"
        : block.align === "right"
        ? "text-right"
        : "text-left";

    switch (block.type) {
      case "heading": {
        const Tag =
          block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
        const sizeCls = compactForTextbook
          ? block.level === 1
            ? "clear-both text-lg sm:text-xl font-bold mt-2 mb-2 text-[#4a180d] border-b border-[#8c6239]/40 pb-1"
            : "clear-both text-base sm:text-lg font-bold mt-2 mb-1.5 text-[#4a180d]"
          : block.level === 1
          ? "clear-both text-xl sm:text-2xl font-bold mt-3 mb-2 text-[#4a180d] border-b border-[#8c6239]/40 pb-1.5"
          : "clear-both text-lg sm:text-xl font-bold mt-2 mb-2 text-[#4a180d]";
        return (
          <Tag key={block.id} className={`${sizeCls} ${alignClass}`}>
            {renderRichHtmlWithFootnotes(block.content, footnotesList)}
          </Tag>
        );
      }

      case "paragraph":
        return (
          <p
            key={block.id}
            className={`${alignClass} ${
              isFirstParagraph && block.align !== "center"
                ? "revival-dropcap"
                : ""
            } text-sm leading-snug text-[#26170a] sm:text-[15.5px] lg:text-[16.5px] lg:leading-relaxed`}
          >
            {renderRichHtmlWithFootnotes(block.content, footnotesList)}
          </p>
        );

      case "quote":
        return (
          <blockquote
            key={block.id}
            className="clear-both relative my-2 border-y-2 border-[#7a5230] bg-gradient-to-r from-[#e5cf9f]/40 via-[#ead7b3]/80 to-[#e5cf9f]/40 px-4 py-2 text-center shadow-inner"
          >
            <div className="mb-0.5 text-[10px] text-[#6e1a12]">─── ❦ ───</div>
            <p className="font-serif text-sm font-bold italic text-[#3a180b] sm:text-base lg:text-lg">
              „{renderRichHtmlWithFootnotes(block.content, footnotesList)}“
            </p>
            {block.quoteAuthor && (
              <footer className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6e1a12]">
                —{" "}
                {renderRichHtmlWithFootnotes(block.quoteAuthor, footnotesList)}
              </footer>
            )}
          </blockquote>
        );

      case "code":
        return (
          <div
            key={block.id}
            className="clear-both my-2 border-2 border-[#5a3518] bg-[#241509] p-2.5 font-mono text-[11px] text-[#f4ead5] shadow-md sm:text-xs lg:text-[13px]"
          >
            <pre className="overflow-x-auto leading-snug">
              <code>{block.content}</code>
            </pre>
          </div>
        );

      case "image": {
        const layout =
          block.imageLayout ||
          (block.imageSize === "full" ? "full-page" : "center");
        const size =
          block.imageSize || (layout === "full-page" ? "full" : "medium");
        const crop = block.imageCrop || "contain";
        const focus = block.imageFocus || "center";

        const focusCls =
          focus === "top"
            ? "object-top"
            : focus === "bottom"
            ? "object-bottom"
            : focus === "left"
            ? "object-left"
            : focus === "right"
            ? "object-right"
            : "object-center";

        const cropCls =
          crop === "portrait"
            ? `aspect-[3/4] object-cover ${focusCls}`
            : crop === "square"
            ? `aspect-square object-cover ${focusCls}`
            : crop === "landscape"
            ? `aspect-[4/3] object-cover ${focusCls}`
            : crop === "wide"
            ? `aspect-video object-cover ${focusCls}`
            : "object-contain";

        const isFullPage = layout === "full-page" || size === "full";
        const isFloatLeft = layout === "float-left";
        const isFloatRight = layout === "float-right";
        const isSideLayout = isFloatLeft || isFloatRight;

        // Width & height classes depending on layout, size, and crop
        let frameWidthCls = "inline-block";
        let imgDimensionCls = "";

        if (isFullPage) {
          frameWidthCls =
            crop === "contain"
              ? "inline-block max-w-full"
              : "block w-full max-w-3xl mx-auto";
          imgDimensionCls = compactForTextbook
            ? crop === "contain"
              ? "max-h-[42vh] sm:max-h-[48vh] w-auto mx-auto"
              : "w-full max-h-[44vh] sm:max-h-[50vh]"
            : crop === "contain"
            ? "max-h-[46vh] sm:max-h-[54vh] w-auto mx-auto"
            : "w-full max-h-[48vh] sm:max-h-[56vh]";
        } else if (isSideLayout) {
          frameWidthCls = "block w-full";
          imgDimensionCls =
            crop === "contain"
              ? size === "small"
                ? "max-h-[16vh] sm:max-h-[20vh] w-auto mx-auto"
                : size === "large"
                ? "max-h-[26vh] sm:max-h-[32vh] w-auto mx-auto"
                : "max-h-[21vh] sm:max-h-[26vh] w-auto mx-auto"
              : "w-full";
        } else {
          // Centered standalone image
          if (crop === "contain") {
            imgDimensionCls =
              size === "small"
                ? "max-h-[13vh] sm:max-h-[16vh] w-auto"
                : size === "large"
                ? compactForTextbook
                  ? "max-h-[28vh] sm:max-h-[34vh] w-auto"
                  : "max-h-[32vh] sm:max-h-[38vh] w-auto"
                : compactForTextbook
                ? "max-h-[18vh] sm:max-h-[21vh] w-auto"
                : "max-h-[21vh] sm:max-h-[25vh] w-auto";
          } else {
            frameWidthCls =
              size === "small"
                ? "inline-block w-36 sm:w-44"
                : size === "large"
                ? "inline-block w-64 sm:w-80"
                : "inline-block w-48 sm:w-60";
            imgDimensionCls = "w-full";
          }
        }

        const sideFigureWidthCls = compactForTextbook
          ? size === "small"
            ? "w-28 sm:w-32 md:w-36"
            : size === "large"
            ? "w-44 sm:w-52 md:w-56"
            : "w-36 sm:w-40 md:w-44"
          : size === "small"
          ? "w-32 sm:w-36 md:w-40"
          : size === "large"
          ? "w-48 sm:w-56 md:w-64"
          : "w-40 sm:w-44 md:w-48";

        const useCssFloat =
          isSideLayout &&
          (compactForTextbook ||
            !block.content?.trim() ||
            block.imageLayout === "float-left" ||
            block.imageLayout === "float-right");

        const figureElement = (
          <figure
            key={block.id}
            className={
              useCssFloat
                ? `${
                    isFloatLeft
                      ? "mx-auto mb-2.5 sm:float-left sm:mb-2 sm:mr-4"
                      : "mx-auto mb-2.5 sm:float-right sm:mb-2 sm:ml-4"
                  } ${sideFigureWidthCls} text-center`
                : isSideLayout
                ? `${sideFigureWidthCls} shrink-0 mx-auto text-center`
                : `clear-both my-2 text-center ${
                    isFullPage ? "w-full" : ""
                  }`
            }
          >
            {block.mediaUrl ? (
              <div
                onClick={() =>
                  setLightboxImage({
                    url: block.mediaUrl!,
                    caption: block.caption,
                  })
                }
                className={`antique-photo-frame group relative cursor-zoom-in p-1.5 sm:p-2 ${frameWidthCls}`}
              >
                <span className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-[#5a3518]" />
                <span className="pointer-events-none absolute right-1 top-1 h-3 w-3 border-r-2 border-t-2 border-[#5a3518]" />
                <span className="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-[#5a3518]" />
                <span className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-[#5a3518]" />

                <img
                  src={block.mediaUrl}
                  alt={block.alt || block.caption || "Историческа гравюра"}
                  className={`${imgDimensionCls} ${cropCls} ${
                    isSideLayout && !compactForTextbook
                      ? "max-h-[26vh]"
                      : isSideLayout && compactForTextbook
                      ? "max-h-[24vh]"
                      : ""
                  } border border-[#7a5230]/60 sepia-[0.18] contrast-[1.03] transition duration-300 group-hover:scale-[1.01]`}
                />
              </div>
            ) : null}
            {block.caption && (
              <figcaption className="mx-auto mt-1 max-w-2xl font-serif text-[11px] italic leading-snug text-[#4e3016] sm:text-xs">
                ❦ {block.caption}
              </figcaption>
            )}
          </figure>
        );

        // If the image is set to side-by-side AND has inline companion paragraph text in block.content:
        // Use true CSS float so text flows naturally beside and below the image without leaving empty holes.
        if (isSideLayout && block.content && block.content.trim().length > 0) {
          return (
            <div key={block.id} className="my-1.5 after:clear-both after:block">
              {figureElement}
              <p
                className={`${alignClass} ${
                  isFirstParagraph && block.align !== "center"
                    ? "revival-dropcap"
                    : ""
                } text-sm leading-relaxed text-[#26170a] sm:text-[15.5px] lg:text-[16.5px] lg:leading-relaxed`}
              >
                {renderRichHtmlWithFootnotes(block.content, footnotesList)}
              </p>
            </div>
          );
        }

        return figureElement;
      }

      case "media":
        return (
          <div
            key={block.id}
            className="my-3 border-2 border-[#6b4423] bg-[#efe3c8]/70 p-3"
          >
            {block.mediaType === "video" && block.mediaUrl ? (
              <video
                src={block.mediaUrl}
                controls
                className="max-h-[25vh] w-full border border-[#6b4423]"
              />
            ) : block.mediaType === "audio" && block.mediaUrl ? (
              <audio src={block.mediaUrl} controls className="w-full" />
            ) : block.mediaUrl ? (
              <iframe
                src={block.mediaUrl}
                title={block.caption || "Медия"}
                className="h-44 w-full border border-[#6b4423] bg-white"
              />
            ) : null}
            {block.caption && (
              <p className="mt-1.5 text-center text-xs italic">
                {block.caption}
              </p>
            )}
          </div>
        );

      case "collapsible": {
        const isOpen = Boolean(openCollapsibles[block.id]);
        return (
          <div
            key={block.id}
            className="clear-both my-3 border-2 border-[#7a5230] bg-[#e6d3ad]/75 shadow-sm transition"
          >
            <button
              type="button"
              onClick={() =>
                setOpenCollapsibles((prev) => ({
                  ...prev,
                  [block.id]: !isOpen,
                }))
              }
              className="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-bold text-[#3d1c0a] hover:bg-[#dcc394]/70 sm:text-sm"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#6e1a12]" />
                <span>{block.collapsibleTitle || "Архивна справка"}</span>
              </span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-[#6e1a12]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#6e1a12]" />
              )}
            </button>
            {isOpen && (
              <div className="border-t border-[#8c6239]/50 bg-[#f6ebd4]/70 px-4 py-2.5 font-serif text-sm leading-relaxed text-[#26170a] sm:text-base">
                {renderRichHtmlWithFootnotes(block.content, footnotesList)}
              </div>
            )}
          </div>
        );
      }

      case "choice":
        return (
          <section
            key={block.id}
            className="clear-both my-3 border-2 border-[#7a5230] bg-gradient-to-b from-[#e8d5b0]/90 to-[#dec596]/80 p-3.5 shadow-inner"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e1a12]">
              <Compass className="h-3.5 w-3.5" />
              <span>Прелистване към раздел от летописа</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(block.choices || []).map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleChoiceSelect(choice)}
                  className="group flex items-center justify-between border border-[#6b4423] bg-[#f7efde] px-3.5 py-2 text-left text-[#2b1d0e] shadow-sm transition hover:border-[#4a180d] hover:bg-[#4a2611] hover:text-[#f7efde]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate text-xs font-bold sm:text-sm">
                      {choice.label}
                    </div>
                    {choice.description && (
                      <p className="truncate text-[11px] italic opacity-80">
                        {choice.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </section>
        );

      default:
        return (
          <p key={block.id}>
            {renderRichHtmlWithFootnotes(block.content, footnotesList)}
          </p>
        );
    }
  };

  // Renders a list of blocks in a float-aware / multi-column container so images and text
  // fill the slide or textbook page cleanly without awkward empty voids or vertical overflow.
  const renderBlocksWithImageFlow = (
    blocks: BookBlock[],
    compactForTextbook: boolean,
    footnotesList?: FootnoteItem[],
    firstParaId?: string
  ) => {
    // Helper to render a clean vertical card for a 2-column Presentation spread
    const renderPresentationCard = (block: BookBlock, isFirst: boolean) => {
      const crop = block.imageCrop || "contain";
      const focus = block.imageFocus || "center";
      const focusCls =
        focus === "top"
          ? "object-top"
          : focus === "bottom"
          ? "object-bottom"
          : "object-center";
      const cropCls =
        crop === "portrait"
          ? `aspect-[3/4] object-cover ${focusCls}`
          : crop === "square"
          ? `aspect-square object-cover ${focusCls}`
          : crop === "landscape"
          ? `aspect-[4/3] object-cover ${focusCls}`
          : crop === "wide"
          ? `aspect-video object-cover ${focusCls}`
          : "object-contain";

      return (
        <div
          key={block.id}
          className="flex h-full flex-col items-center border border-[#8c6239]/40 bg-[#efe0c0]/45 p-3.5 shadow-inner"
        >
          {block.mediaUrl && (
            <div
              onClick={() =>
                setLightboxImage({
                  url: block.mediaUrl!,
                  caption: block.caption,
                })
              }
              className="antique-photo-frame group relative cursor-zoom-in p-1.5"
            >
              <span className="pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-[#5a3518]" />
              <span className="pointer-events-none absolute right-1 top-1 h-2.5 w-2.5 border-r-2 border-t-2 border-[#5a3518]" />
              <span className="pointer-events-none absolute bottom-1 left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-[#5a3518]" />
              <span className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-[#5a3518]" />
              <img
                src={block.mediaUrl}
                alt={block.alt || block.caption || "Историческа гравюра"}
                className={`max-h-[23vh] w-auto ${cropCls} border border-[#7a5230]/60 sepia-[0.18] contrast-[1.03] transition duration-300 group-hover:scale-[1.01]`}
              />
            </div>
          )}
          {block.caption && (
            <p className="mt-1.5 text-center font-serif text-[11px] italic leading-snug text-[#4e3016]">
              ❦ {block.caption}
            </p>
          )}
          {block.content && block.content.trim().length > 0 && (
            <p
              className={`mt-2 w-full text-left font-serif text-[14.5px] leading-relaxed text-[#26170a] ${
                isFirst ? "revival-dropcap" : ""
              }`}
            >
              {renderRichHtmlWithFootnotes(block.content, footnotesList)}
            </p>
          )}
        </div>
      );
    };

    // Presentation Mode: 2-column balanced layout when a slide has 2 side-by-side image blocks
    if (!compactForTextbook) {
      const imageBlocks = blocks.filter(
        (b) =>
          b.type === "image" &&
          b.imageLayout !== "full-page" &&
          b.imageSize !== "full"
      );
      const otherBlocks = blocks.filter((b) => !imageBlocks.includes(b));

      if (imageBlocks.length === 2) {
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {imageBlocks.map((imgBlk, i) =>
                renderPresentationCard(imgBlk, i === 0 && !firstParaId)
              )}
            </div>
            {otherBlocks.map((block) =>
              renderBlockItem(
                block,
                compactForTextbook,
                footnotesList,
                block.id === firstParaId
              )
            )}
          </div>
        );
      }

      // Presentation Mode: 2-column editorial spread for text-only 2-paragraph slides (e.g. Slides V & IX)
      if (
        blocks.length === 2 &&
        blocks.every((b) => b.type === "paragraph")
      ) {
        return (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex flex-col justify-center border border-[#8c6239]/50 bg-[#efe0c0]/55 p-5 shadow-inner"
              >
                <p
                  className={`${
                    block.id === firstParaId && block.align !== "center"
                      ? "revival-dropcap"
                      : ""
                  } font-serif text-base leading-relaxed text-[#26170a] sm:text-[17px]`}
                >
                  {renderRichHtmlWithFootnotes(block.content, footnotesList)}
                </p>
              </div>
            ))}
          </div>
        );
      }
    }

    const ordered = [...blocks];
    for (let i = 1; i < ordered.length; i++) {
      const b = ordered[i];
      const isFloatingImg =
        b.type === "image" &&
        (b.imageLayout === "float-left" || b.imageLayout === "float-right") &&
        !b.content?.trim();
      const nextBlock = ordered[i + 1];
      const prevBlock = ordered[i - 1];
      if (
        isFloatingImg &&
        nextBlock?.type !== "paragraph" &&
        prevBlock?.type === "paragraph"
      ) {
        ordered[i - 1] = b;
        ordered[i] = prevBlock;
      }
    }

    // If a floating image is immediately followed by another paragraph, let them share the float flow
    // so the second paragraph wraps beside the image instead of leaving an empty void below paragraph 1.
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < ordered.length; i++) {
      const block = ordered[i];
      const nextBlock = ordered[i + 1];
      const isFloatingWithContent =
        block.type === "image" &&
        (block.imageLayout === "float-left" ||
          block.imageLayout === "float-right") &&
        Boolean(block.content?.trim());

      if (isFloatingWithContent && nextBlock?.type === "paragraph") {
        const imgOnlyBlock: BookBlock = { ...block, content: "" };
        nodes.push(
          <div key={`${block.id}-flow`} className="after:clear-both after:block">
            {renderBlockItem(imgOnlyBlock, compactForTextbook, footnotesList, false)}
            <p
              className={`${
                block.align === "center"
                  ? "text-center"
                  : block.align === "right"
                  ? "text-right"
                  : "text-left"
              } mb-2.5 text-sm leading-relaxed text-[#26170a] sm:text-[15.5px] lg:text-[16.5px] lg:leading-relaxed`}
            >
              {renderRichHtmlWithFootnotes(block.content, footnotesList)}
            </p>
            {renderBlockItem(
              nextBlock,
              compactForTextbook,
              footnotesList,
              nextBlock.id === firstParaId
            )}
          </div>
        );
        i++; // consumed nextBlock
      } else {
        nodes.push(
          renderBlockItem(
            block,
            compactForTextbook,
            footnotesList,
            block.id === firstParaId
          )
        );
      }
    }

    return (
      <div className="space-y-2.5 after:clear-both after:block">{nodes}</div>
    );
  };

  // Helper to split any chapter's blocks into Left and Right textbook pages
  const getTextbookSplit = (targetCh: Chapter) => {
    const nonChoice = targetCh.blocks.filter((b) => b.type !== "choice");
    const splitPt = Math.max(1, Math.ceil(nonChoice.length / 2));
    const left: BookBlock[] = [];
    const right: BookBlock[] = [];
    let nonChoiceSeen = 0;

    targetCh.blocks.forEach((b) => {
      let side: "left" | "right";
      if (b.pageSide === "left" || b.pageSide === "right") {
        side = b.pageSide;
        if (b.type !== "choice") nonChoiceSeen++;
      } else if (b.type === "choice") {
        side = "right";
      } else {
        side = nonChoiceSeen < splitPt ? "left" : "right";
        nonChoiceSeen++;
      }

      if (side === "left") left.push(b);
      else right.push(b);
    });

    return { left, right };
  };

  // Touch swipe handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Require clear horizontal swipe (> 55px and predominantly horizontal)
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) {
        if (nextChapter) {
          navigateToChapterWithFlip(nextChapter.slug, "next");
        } else if (chapters.length > 0) {
          navigateToChapterWithFlip(chapters[0].slug, "next");
        }
      } else if (dx > 0 && prevChapter) {
        navigateToChapterWithFlip(prevChapter.slug, "prev");
      }
    }
  };

  const renderPresentationBody = (targetCh: Chapter, idx: number) => {
    const firstParaId = targetCh.blocks.find((b) => b.type === "paragraph")?.id;

    return (
      <div className="flex h-full flex-col justify-between">
        {/* Ornate 1844 Periodical Header */}
        <header className="shrink-0 border-b-2 border-double border-[#6b4423] pb-2 text-center">
          <div className="mb-0.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#6e1a12]">
            <span>─── ❦</span>
            <span>
              Лист {ROMAN_NUMERALS[idx] || idx + 1} от{" "}
              {ROMAN_NUMERALS[chapters.length - 1] || chapters.length} • Летопис
            </span>
            <span>❦ ───</span>
          </div>

          {targetCh.title && (
            <h1 className="font-serif text-xl font-bold tracking-wide text-[#241307] sm:text-2xl lg:text-3xl">
              {targetCh.title}
            </h1>
          )}

          {targetCh.subtitle && (
            <p className="mt-0.5 font-serif text-xs italic text-[#5c3618] sm:text-sm lg:text-base">
              {targetCh.subtitle}
            </p>
          )}
        </header>

        {/* Middle Content Area (Fit to screen without vertical scrolling) */}
        <div className="vintage-scroll my-2 flex-1 overflow-y-auto px-2 pr-3 font-serif">
          <div className="flex min-h-full flex-col justify-center py-1">
            {renderBlocksWithImageFlow(
              targetCh.blocks,
              false,
              targetCh.footnotes,
              firstParaId
            )}

            {targetCh.footnotes && targetCh.footnotes.length > 0 && (
              <section className="clear-both mt-4 border-t border-[#8c6239]/50 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllFootnotes((v) => !v)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#6e1a12]">
                    ❦ Архивни бележки под линия ({targetCh.footnotes.length})
                  </span>
                  <span className="text-[11px] font-bold underline text-[#5a3518]">
                    {showAllFootnotes ? "Скрий" : "Покажи"}
                  </span>
                </button>

                {showAllFootnotes && (
                  <ol className="mt-1.5 space-y-1 text-xs">
                    {targetCh.footnotes.map((fn) => (
                      <li
                        key={fn.id}
                        className="border border-[#8c6239]/50 bg-[#ead8b4]/60 px-3 py-1.5"
                      >
                        <strong className="mr-1.5 text-[#6e1a12]">
                          [{fn.number}]
                        </strong>
                        <span>{fn.content}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Pinned Antique Slide Footer */}
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t-2 border-double border-[#6b4423] pt-2.5 sm:pt-3">
          {prevChapter ? (
            <button
              type="button"
              onClick={() =>
                navigateToChapterWithFlip(prevChapter.slug, "prev")
              }
              className="group flex max-w-[47%] items-center gap-1.5 border-2 border-[#5a3518] bg-[#f7efde] px-2.5 py-1.5 text-left text-[#2b1d0e] shadow-sm transition hover:bg-[#4a2611] hover:text-[#f7efde] sm:max-w-none sm:gap-2 sm:px-3.5"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-x-1" />
              <div className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-[#6e1a12] group-hover:text-[#e8d2a6]">
                  Предишен лист
                </span>
                <span className="block truncate text-[11px] font-bold sm:text-xs">
                  {prevChapter.title || "Предишен слайд"}
                </span>
              </div>
            </button>
          ) : (
            <div />
          )}

          <div className="hidden text-center text-xs italic text-[#523418] md:block">
            ❦ Съставили: Стоян Калчев и Константин Караниколов ❦
          </div>

          {nextChapter ? (
            <button
              type="button"
              onClick={() =>
                navigateToChapterWithFlip(nextChapter.slug, "next")
              }
              className="group flex max-w-[47%] items-center gap-1.5 border-2 border-[#4a180d] bg-gradient-to-b from-[#6e1a12] to-[#4e110b] px-2.5 py-1.5 text-right text-[#f7efde] shadow transition hover:from-[#5a150e] hover:to-[#3b0c07] sm:max-w-none sm:gap-2 sm:px-4"
            >
              <div className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-[#ebd29c]">
                  Следващ лист
                </span>
                <span className="block truncate text-[11px] font-bold sm:text-xs">
                  {nextChapter.title || "Следващ слайд"}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                navigateToChapterWithFlip(chapters[0].slug, "next")
              }
              className="group flex items-center gap-1.5 border-2 border-[#5a3518] bg-[#f7efde] px-3 py-1.5 text-xs font-bold text-[#2b1d0e] transition hover:bg-[#4a2611] hover:text-[#f7efde]"
            >
              <span>❦ Към Лист I (Начало)</span>
            </button>
          )}
        </footer>
      </div>
    );
  };

  // Renders ONLY the Left Page of a Textbook Spread
  const renderSingleLeftPage = (targetCh: Chapter, idx: number) => {
    const { left } = getTextbookSplit(targetCh);
    const firstLeftParaId = left.find((b) => b.type === "paragraph")?.id;
    const prevCh = idx > 0 ? chapters[idx - 1] : null;

    return (
      <div className="textbook-left-page relative flex h-full w-full min-h-0 flex-col justify-between border border-[#8c6239]/70 p-4 text-[#26170a] sm:p-6 lg:rounded-l-sm">
        {/* Running Header */}
        <div className="mb-2 flex shrink-0 items-center justify-between border-b-2 border-double border-[#6b4423]/60 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c3618]">
          <span>❦ ВЪЗРОЖДЕНСКА ЧИТАНКА • ЛЮБОСЛОВИЕ</span>
          <span>ДЯЛ {ROMAN_NUMERALS[idx] || idx + 1}</span>
        </div>

        {/* Left Page Scrollable Body */}
        <div className="vintage-scroll flex-1 overflow-y-auto pr-1.5">
          <div className="flex min-h-full flex-col justify-between py-1">
            {(targetCh.title || targetCh.subtitle) && (
              <div className="mb-3 border-2 border-double border-[#5a3518] bg-gradient-to-b from-[#efe0be] to-[#e4cfa3] p-3 text-center shadow-inner">
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.22em] text-[#6e1a12]">
                  ─── ❦ Урок {ROMAN_NUMERALS[idx] || idx + 1} ❦ ───
                </span>
                {targetCh.title && (
                  <h1 className="mt-1 font-serif text-lg font-bold text-[#241307] sm:text-2xl">
                    {targetCh.title}
                  </h1>
                )}
                {targetCh.subtitle && (
                  <p className="mt-0.5 font-serif text-xs italic text-[#523015] sm:text-sm">
                    {targetCh.subtitle}
                  </p>
                )}
              </div>
            )}

            <div className="my-auto font-serif">
              {renderBlocksWithImageFlow(
                left,
                true,
                targetCh.footnotes,
                firstLeftParaId
              )}
            </div>
          </div>
        </div>

        {/* Left Page Footer */}
        <div className="mt-2 flex shrink-0 items-center justify-between border-t border-[#8c6239]/50 pt-2 text-xs font-bold text-[#5a3518]">
          {prevCh ? (
            <button
              type="button"
              onClick={() => navigateToChapterWithFlip(prevCh.slug, "prev")}
              className="group flex items-center gap-1.5 border border-[#6b4423] bg-[#f7efde] px-2.5 py-1 text-[11px] font-bold text-[#2b1d0e] shadow-sm transition hover:bg-[#4a2611] hover:text-[#f7efde]"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Предишен лист</span>
            </button>
          ) : (
            <span className="text-[11px] italic opacity-75">
              ❦ Първи лист на книгата
            </span>
          )}

          <span className="font-serif text-xs font-bold tracking-widest text-[#4a2611]">
            — {idx * 2 + 1} —
          </span>
        </div>

        {/* Interactive Bottom-Left Curled Page Corner for Previous Page */}
        {prevCh && (
          <button
            type="button"
            onClick={() => navigateToChapterWithFlip(prevCh.slug, "prev")}
            title="Натиснете ъгъла, за да върнете предишната страница"
            className="group absolute bottom-0 left-0 z-20 h-11 w-11 overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 h-6 w-6 border-r border-t border-[#8c6239] bg-gradient-to-tr from-[#bfa576] via-[#e6d5b8] to-[#fdf8ee] shadow-[3px_-3px_8px_rgba(0,0,0,0.28)] transition-all duration-300 group-hover:h-10 group-hover:w-10" />
          </button>
        )}
      </div>
    );
  };

  // Renders ONLY the Right Page of a Textbook Spread
  const renderSingleRightPage = (targetCh: Chapter, idx: number) => {
    const { right } = getTextbookSplit(targetCh);
    const nextCh =
      idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

    return (
      <div className="textbook-right-page relative flex h-full w-full min-h-0 flex-col justify-between border border-[#8c6239]/70 p-4 text-[#26170a] sm:p-6 lg:rounded-r-sm">
        {/* Running Header */}
        <div className="mb-2 flex shrink-0 items-center justify-between border-b-2 border-double border-[#6b4423]/60 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c3618]">
          <span>КОНСТАНТИН Г. ФОТИНОВ (1790 – 1858)</span>
          <span>СТ. КАЛЧЕВ & К. КАРАНИКОЛОВ ❦</span>
        </div>

        {/* Right Page Scrollable Body */}
        <div className="vintage-scroll flex-1 overflow-y-auto pr-1.5">
          <div className="flex min-h-full flex-col justify-center py-1">
            <div className="font-serif">
              {renderBlocksWithImageFlow(right, true, targetCh.footnotes)}
            </div>

            {targetCh.footnotes && targetCh.footnotes.length > 0 && (
              <div className="clear-both mt-4 border-2 border-dashed border-[#7a5230] bg-[#e8d5b0]/65 p-3">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6e1a12]">
                  <BookMarked className="h-3 w-3" />
                  <span>Бележки и пояснения от летописа:</span>
                </h4>
                <ol className="mt-1.5 space-y-1 text-xs">
                  {targetCh.footnotes.map((fn) => (
                    <li key={fn.id}>
                      <strong className="text-[#6e1a12]">[{fn.number}]</strong>{" "}
                      {fn.content}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Right Page Footer */}
        <div className="mt-2 flex shrink-0 items-center justify-between border-t border-[#8c6239]/50 pt-2 text-xs font-bold text-[#5a3518]">
          <span className="font-serif text-xs font-bold tracking-widest text-[#4a2611]">
            — {idx * 2 + 2} —
          </span>

          {nextCh ? (
            <button
              type="button"
              onClick={() => navigateToChapterWithFlip(nextCh.slug, "next")}
              className="group flex items-center gap-1.5 border border-[#4a180d] bg-gradient-to-b from-[#6e1a12] to-[#4e110b] px-3 py-1 text-[11px] font-bold text-[#f7efde] shadow-sm transition hover:from-[#5a150e] hover:to-[#3b0c07]"
            >
              <span>Следващ лист</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateToChapterWithFlip(chapters[0].slug, "next")}
              className="group flex items-center gap-1.5 border border-[#6b4423] bg-[#f7efde] px-2.5 py-1 text-[11px] font-bold text-[#2b1d0e] hover:bg-[#4a2611] hover:text-[#f7efde]"
            >
              <span>❦ Отначало (Стр. 1)</span>
            </button>
          )}
        </div>

        {/* Interactive Bottom-Right Curled Page Corner */}
        {nextCh && (
          <button
            type="button"
            onClick={() => navigateToChapterWithFlip(nextCh.slug, "next")}
            title="Натиснете ъгъла, за да прелистите страницата"
            className="group absolute bottom-0 right-0 z-20 h-12 w-12 overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 h-7 w-7 border-l border-t border-[#8c6239] bg-gradient-to-tl from-[#bfa576] via-[#e6d5b8] to-[#fdf8ee] shadow-[-3px_-3px_8px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:h-11 group-hover:w-11" />
          </button>
        )}
      </div>
    );
  };

  // Mobile Textbook Spread Renderer (< lg): ensures BOTH Left and Right pages are accessible on phones/tablets
  const renderMobileTextbookSpread = (targetCh: Chapter, idx: number) => {
    const { left, right } = getTextbookSplit(targetCh);
    const firstLeftParaId = left.find((b) => b.type === "paragraph")?.id;
    const prevCh = idx > 0 ? chapters[idx - 1] : null;
    const nextCh =
      idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;
    const leftPageNum = idx * 2 + 1;
    const rightPageNum = idx * 2 + 2;

    return (
      <div className="textbook-left-page relative flex h-full w-full min-h-0 flex-col justify-between border border-[#8c6239]/70 p-3.5 text-[#26170a] sm:p-5">
        {/* Mobile Textbook Page Switcher (Both / Left / Right) */}
        <div className="mb-2 flex shrink-0 flex-col gap-1.5 border-b-2 border-double border-[#6b4423]/60 pb-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-[#5c3618]">
            <span>❦ УЧЕБНИК • ЛИСТ {ROMAN_NUMERALS[idx] || idx + 1}</span>
            <span>
              СТР. {leftPageNum}–{rightPageNum}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded border border-[#8c6239] bg-[#e6d3ad] p-0.5">
            <button
              type="button"
              onClick={() => setMobileTextbookTab("both")}
              className={`py-1 text-[11px] font-bold transition ${
                mobileTextbookTab === "both"
                  ? "bg-[#6e1a12] text-[#f7efde] shadow-sm"
                  : "text-[#3d2310] hover:bg-[#d8c093]"
              }`}
            >
              📖 Цял разтвор
            </button>
            <button
              type="button"
              onClick={() => setMobileTextbookTab("left")}
              className={`py-1 text-[11px] font-bold transition ${
                mobileTextbookTab === "left"
                  ? "bg-[#6e1a12] text-[#f7efde] shadow-sm"
                  : "text-[#3d2310] hover:bg-[#d8c093]"
              }`}
            >
              ⬅️ Лява ({leftPageNum})
            </button>
            <button
              type="button"
              onClick={() => setMobileTextbookTab("right")}
              className={`py-1 text-[11px] font-bold transition ${
                mobileTextbookTab === "right"
                  ? "bg-[#6e1a12] text-[#f7efde] shadow-sm"
                  : "text-[#3d2310] hover:bg-[#d8c093]"
              }`}
            >
              Дясна ({rightPageNum}) ➡️
            </button>
          </div>
        </div>

        {/* Scrollable Mobile Textbook Body */}
        <div className="vintage-scroll flex-1 overflow-y-auto pr-1">
          {(mobileTextbookTab === "both" || mobileTextbookTab === "left") && (
            <div>
              {mobileTextbookTab === "both" && (
                <div className="mb-2 flex items-center justify-between border-b border-[#8c6239]/40 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#6e1a12]">
                  <span>⬅️ Лява страница</span>
                  <span>Стр. {leftPageNum}</span>
                </div>
              )}

              {(targetCh.title || targetCh.subtitle) && (
                <div className="mb-3 border-2 border-double border-[#5a3518] bg-gradient-to-b from-[#efe0be] to-[#e4cfa3] p-2.5 text-center shadow-inner">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e1a12]">
                    ─── ❦ Урок {ROMAN_NUMERALS[idx] || idx + 1} ❦ ───
                  </span>
                  {targetCh.title && (
                    <h1 className="mt-1 font-serif text-lg font-bold text-[#241307] sm:text-xl">
                      {targetCh.title}
                    </h1>
                  )}
                  {targetCh.subtitle && (
                    <p className="mt-0.5 font-serif text-xs italic text-[#523015]">
                      {targetCh.subtitle}
                    </p>
                  )}
                </div>
              )}

              <div className="font-serif">
                {renderBlocksWithImageFlow(
                  left,
                  true,
                  targetCh.footnotes,
                  firstLeftParaId
                )}
              </div>
            </div>
          )}

          {/* Ornate Divider between Left and Right page when viewing full spread on mobile */}
          {mobileTextbookTab === "both" && right.length > 0 && (
            <div className="clear-both my-4 flex items-center gap-2 border-y-2 border-dashed border-[#8c6239] bg-[#e6d3ad]/70 px-3 py-1.5 text-center">
              <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6e1a12]">
                ─── ❦ Преход към Дясна страница (Стр. {rightPageNum}) ❦ ───
              </span>
            </div>
          )}

          {(mobileTextbookTab === "both" || mobileTextbookTab === "right") && (
            <div>
              {mobileTextbookTab === "right" && (
                <div className="mb-2 flex items-center justify-between border-b border-[#8c6239]/40 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#6e1a12]">
                  <span>Дясна страница ➡️</span>
                  <span>Стр. {rightPageNum}</span>
                </div>
              )}

              <div className="font-serif">
                {renderBlocksWithImageFlow(right, true, targetCh.footnotes)}
              </div>

              {targetCh.footnotes && targetCh.footnotes.length > 0 && (
                <div className="mt-4 border-2 border-dashed border-[#7a5230] bg-[#e8d5b0]/65 p-3">
                  <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6e1a12]">
                    <BookMarked className="h-3 w-3" />
                    <span>Бележки и пояснения от летописа:</span>
                  </h4>
                  <ol className="mt-1.5 space-y-1 text-xs">
                    {targetCh.footnotes.map((fn) => (
                      <li key={fn.id}>
                        <strong className="text-[#6e1a12]">[{fn.number}]</strong>{" "}
                        {fn.content}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Textbook Footer with Prev + Page Numbers + Next */}
        <div className="mt-2 flex shrink-0 items-center justify-between gap-1 border-t border-[#8c6239]/50 pt-2 text-xs font-bold text-[#5a3518]">
          {prevCh ? (
            <button
              type="button"
              onClick={() => navigateToChapterWithFlip(prevCh.slug, "prev")}
              className="flex items-center gap-1 border border-[#6b4423] bg-[#f7efde] px-2.5 py-1 text-[11px] font-bold text-[#2b1d0e] shadow-sm"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Предишен</span>
            </button>
          ) : (
            <span className="text-[10px] italic opacity-75">❦ Начало</span>
          )}

          <span className="font-serif text-[11px] font-bold tracking-wider text-[#4a2611]">
            Стр. {leftPageNum}–{rightPageNum}
          </span>

          {nextCh ? (
            <button
              type="button"
              onClick={() => navigateToChapterWithFlip(nextCh.slug, "next")}
              className="flex items-center gap-1 border border-[#4a180d] bg-gradient-to-b from-[#6e1a12] to-[#4e110b] px-2.5 py-1 text-[11px] font-bold text-[#f7efde] shadow-sm"
            >
              <span>Следващ</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateToChapterWithFlip(chapters[0].slug, "next")}
              className="flex items-center gap-1 border border-[#6b4423] bg-[#f7efde] px-2 py-1 text-[11px] font-bold text-[#2b1d0e]"
            >
              <span>❦ Отначало</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const peelingIdx = peelingChapter
    ? chapters.findIndex((c) => c.slug === peelingChapter.slug)
    : currentIdx;

  // Presentation Mode: which sheet is stationary underneath vs turning on top
  const presBaseChapter =
    flipState === "prev" && peelingChapter ? peelingChapter : chapter;
  const presBaseIdx = chapters.findIndex(
    (c) => c.slug === presBaseChapter.slug
  );
  const presTurningChapter =
    flipState === "next" && peelingChapter
      ? peelingChapter
      : flipState === "prev"
      ? chapter
      : null;

  return (
    <div className="antique-desk-bg flex h-[100dvh] flex-col overflow-hidden font-serif text-[#26170a]">
      {!zenMode && (
        <Navbar
          currentSlug={chapter.slug}
          bookTitle={bookTitle}
          readOnlyPublic={true}
        />
      )}

      {/* Antique Brass & Mahogany Control Ribbon */}
      <div className="z-30 shrink-0 border-b border-[#8c6239]/80 bg-gradient-to-b from-[#2f1b0d] to-[#231308] text-[#f2e2c4] shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 sm:gap-2 sm:px-5">
          {/* Mode Switcher: Presentation Mode vs IRL Textbook Mode */}
          <div className="flex w-full flex-wrap items-center justify-between gap-1.5 sm:w-auto sm:justify-start sm:gap-2">
            <div className="flex items-center border border-[#9c7444] bg-[#1b0e05] p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode("presentation")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold tracking-wider transition sm:gap-1.5 sm:px-3 sm:text-xs ${
                  viewMode === "presentation"
                    ? "border border-[#c89d54]/60 bg-gradient-to-b from-[#7c1d12] to-[#521109] text-[#f7efde] shadow"
                    : "text-[#d2b684] hover:text-white"
                }`}
              >
                <Presentation className="h-3.5 w-3.5" />
                <span>Слайд Летопис</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("textbook")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold tracking-wider transition sm:gap-1.5 sm:px-3 sm:text-xs ${
                  viewMode === "textbook"
                    ? "border border-[#c89d54]/60 bg-gradient-to-b from-[#7c1d12] to-[#521109] text-[#f7efde] shadow"
                    : "text-[#d2b684] hover:text-white"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Разтворен Учебник</span>
              </button>
            </div>

            {/* Auto-Play Controls + Mobile Fullscreen button */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 border border-[#8c6239] bg-[#1b0e05] px-2 py-0.5 sm:px-2.5">
                <button
                  type="button"
                  onClick={() => setAutoPlay((v) => !v)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold tracking-wide transition sm:px-2 sm:text-xs ${
                    autoPlay
                      ? "bg-[#7c1d12] text-[#f7efde]"
                      : "text-[#e2c792] hover:text-white"
                  }`}
                  title="Автоматично прелистване на страниците"
                >
                  {autoPlay ? (
                    <>
                      <Pause className="h-3 w-3 text-[#ebd29c]" />
                      <span>Авто: ВКЛ</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 text-[#c89d54]" />
                      <span>Авто</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1 border-l border-[#8c6239]/50 pl-1.5 text-[11px] text-[#d2b684] sm:pl-2">
                  <Timer className="hidden h-3 w-3 text-[#c89d54] sm:inline" />
                  <select
                    value={autoPlaySeconds}
                    onChange={(e) => setAutoPlaySeconds(Number(e.target.value))}
                    className="bg-transparent font-bold text-[#f2e2c4] focus:outline-none"
                    title="Интервал за автоматично прелистване"
                  >
                    <option className="bg-[#231308]" value={5}>
                      5с
                    </option>
                    <option className="bg-[#231308]" value={8}>
                      8с
                    </option>
                    <option className="bg-[#231308]" value={12}>
                      12с
                    </option>
                    <option className="bg-[#231308]" value={15}>
                      15с
                    </option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setZenMode((z) => !z)}
                title={zenMode ? "Нормален екран" : "На цял екран"}
                className="flex items-center gap-1 border border-[#8c6239] bg-[#2a160a] px-2 py-1 text-xs font-bold text-[#e2c792] transition hover:border-[#c89d54] hover:text-white sm:hidden"
              >
                {zenMode ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Roman Numeral Slide / Page Quick Selector Pills (Horizontally scrollable on mobile!) */}
          <div className="flex w-full items-center gap-1 overflow-x-auto pb-0.5 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0">
            <button
              onClick={() => setTocOpen(true)}
              className="mr-0.5 flex shrink-0 items-center gap-1 border border-[#8c6239] bg-[#2e190c] px-2.5 py-1 text-xs font-bold text-[#e8d2a6] transition hover:border-[#c89d54] hover:bg-[#472814]"
            >
              <List className="h-3.5 w-3.5 text-[#c89d54]" />
              <span className="hidden md:inline">Съдържание</span>
            </button>

            {chapters.map((ch, idx) => {
              const active = ch.slug === chapter.slug;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => navigateToChapterWithFlip(ch.slug)}
                  className={`shrink-0 border px-2 py-1 text-[11px] font-bold tracking-wider transition sm:px-2.5 sm:text-xs ${
                    active
                      ? "border-[#c89d54] bg-gradient-to-b from-[#7c1d12] to-[#521109] text-[#f7efde] shadow"
                      : "border-[#8c6239]/60 bg-[#2a160a] text-[#d2b684] hover:border-[#c89d54] hover:text-white"
                  }`}
                >
                  {viewMode === "textbook"
                    ? `Лист ${ROMAN_NUMERALS[idx] || idx + 1}`
                    : `Слайд ${ROMAN_NUMERALS[idx] || idx + 1}`}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Fullscreen on Desktop */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              onClick={() => setZenMode((z) => !z)}
              title={zenMode ? "Нормален екран" : "На цял екран"}
              className="flex items-center gap-1 border border-[#8c6239] bg-[#2a160a] px-2 py-1 text-xs font-bold text-[#e2c792] transition hover:border-[#c89d54] hover:text-white"
            >
              {zenMode ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Auto-Play Countdown Progress Bar */}
        {autoPlay && (
          <div className="h-1 w-full bg-[#1a0d05]">
            <div
              className="h-full bg-gradient-to-r from-[#8c6239] via-[#c89d54] to-[#7c1d12] transition-all duration-100"
              style={{ width: `${autoPlayProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Audio Narrator Bar (if opened) */}
      {narratorOpen && (
        <div className="mx-auto w-full max-w-5xl shrink-0 px-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#8c6239] bg-[#f4e8cf] px-3.5 py-2 text-[#26170a] shadow-lg">
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleNarratorPlay}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4a180d] bg-[#6e1a12] text-[#f7efde]"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>
              <span className="text-xs font-bold">
                ❦ Гласов прочит: {chapter.title}
              </span>
            </div>

            {chapter.narratorAudioUrl && (
              <audio
                ref={audioRef}
                src={chapter.narratorAudioUrl}
                onEnded={() => setIsPlaying(false)}
                controls
                className="h-7 max-w-xs"
              />
            )}

            <div className="flex items-center gap-1">
              {[0.85, 1, 1.25].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    if (audioRef.current) {
                      audioRef.current.playbackRate = rate;
                    }
                  }}
                  className={`border px-1.5 py-0.5 text-[11px] font-bold ${
                    playbackRate === rate
                      ? "border-[#4a180d] bg-[#6e1a12] text-[#f7efde]"
                      : "border-[#8c6239] bg-white/50 text-[#3d2512]"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Footnote Popover */}
      {activeFootnote && (
        <div className="fixed bottom-4 left-3 right-3 z-40 max-w-md border-2 border-[#6b4423] bg-[#f4e8cf] p-4 text-[#26170a] shadow-2xl sm:bottom-5 sm:left-auto sm:right-5">
          <div className="flex items-start justify-between gap-3">
            <span className="border border-[#4a180d] bg-[#6e1a12] px-2 py-0.5 text-xs font-bold text-[#f7efde]">
              ❦ Архивна бележка [{activeFootnote.number}]
            </span>
            <button
              onClick={() => setActiveFootnote(null)}
              className="p-0.5 text-[#5a3518] hover:bg-[#e2cfa9]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 font-serif text-xs leading-relaxed sm:text-sm">
            {activeFootnote.content}
          </p>
        </div>
      )}

      {/* =====================================================================
          VIEWPORT-FITTED 3D STAGE (Presentation OR Textbook) WITH TOUCH SWIPE
         ===================================================================== */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 min-h-0 w-full px-1.5 py-1.5 sm:px-6 sm:py-4"
      >
        {viewMode === "presentation" ? (
          <main className="book-3d-stage mx-auto h-full max-w-5xl">
            <div className="vintage-parchment relative h-full w-full border-4 border-double border-[#5a3518] p-3 sm:p-7">
              {/* Inner Filigree Frame Line */}
              <div className="pointer-events-none absolute inset-1.5 border border-[#8c6239]/55 sm:inset-2" />

              {/* Ornate Corner Flourishes */}
              <div className="pointer-events-none absolute left-2.5 top-2.5 z-30 h-4 w-4 border-l-2 border-t-2 border-[#6e1a12] sm:left-3 sm:top-3 sm:h-5 sm:w-5" />
              <div className="pointer-events-none absolute right-2.5 top-2.5 z-30 h-4 w-4 border-r-2 border-t-2 border-[#6e1a12] sm:right-3 sm:top-3 sm:h-5 sm:w-5" />
              <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-30 h-4 w-4 border-b-2 border-l-2 border-[#6e1a12] sm:bottom-3 sm:left-3 sm:h-5 sm:w-5" />
              <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-30 h-4 w-4 border-b-2 border-r-2 border-[#6e1a12] sm:bottom-3 sm:right-3 sm:h-5 sm:w-5" />

              {/* Base Stationary Slide underneath */}
              <div className="relative h-full w-full">
                {renderPresentationBody(presBaseChapter, presBaseIdx)}
              </div>

              {/* Cast Shadow on the Base Slide while the Top Sheet Turns */}
              {flipState !== "idle" && (
                <div className="animate-folio-under-shadow pointer-events-none absolute inset-0 z-10" />
              )}

              {/* 3D Turning Folio Sheet Hinged on the Left Spine */}
              {flipState !== "idle" && presTurningChapter && (
                <div
                  className={`vintage-parchment pointer-events-none absolute inset-0 z-20 border-r-2 border-[#8c6239] p-3 sm:p-7 ${
                    flipState === "next"
                      ? "animate-folio-sheet-next"
                      : "animate-folio-sheet-prev"
                  }`}
                >
                  <div className="animate-paper-arch h-full w-full">
                    {renderPresentationBody(
                      presTurningChapter,
                      chapters.findIndex(
                        (c) => c.slug === presTurningChapter.slug
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        ) : (
          <main className="mx-auto h-full max-w-7xl">
            <div className="textbook-cover relative h-full w-full rounded-md p-2 sm:p-4">
              {/* Silk Bookmark Ribbon with Gold Trim hanging from top spine */}
              <div
                className="pointer-events-none absolute left-1/2 top-0 z-40 hidden h-14 w-6 -translate-x-1/2 border-x border-[#c89d54]/60 bg-gradient-to-b from-[#6e1a12] via-[#8a1c14] to-[#4e100b] shadow-lg lg:block"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
                }}
              />

              {/* 3D Two-Page Open Book Container */}
              <div className="book-3d-stage relative h-full w-full">
                {/* Center Spine Deep Crease Shadow (Desktop) */}
                <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 hidden w-12 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#180c04]/60 to-transparent lg:block" />

                {/* MOBILE / TABLET TEXTBOOK VIEW (< lg): Shows full Left + Right spread with switcher */}
                <div className="relative h-full min-h-0 lg:hidden">
                  {renderMobileTextbookSpread(presBaseChapter, presBaseIdx)}
                </div>

                {/* DESKTOP TWO-PAGE OPEN SPREAD (>= lg) */}
                <div className="relative hidden h-full lg:grid lg:grid-cols-2">
                  {/* Base Left Page */}
                  <div className="relative h-full min-h-0">
                    {flipState === "next" && peelingChapter
                      ? renderSingleLeftPage(peelingChapter, peelingIdx)
                      : renderSingleLeftPage(chapter, currentIdx)}

                    {flipState === "next" && (
                      <div className="animate-left-page-shadow pointer-events-none absolute inset-0 z-10" />
                    )}
                  </div>

                  {/* Base Right Page */}
                  <div className="relative h-full min-h-0">
                    {flipState === "prev" && peelingChapter
                      ? renderSingleRightPage(peelingChapter, peelingIdx)
                      : renderSingleRightPage(chapter, currentIdx)}

                    {flipState === "next" && (
                      <div className="animate-right-page-shadow pointer-events-none absolute inset-0 z-10" />
                    )}
                  </div>
                </div>

                {/* 3D TWO-SIDED TURNING LEAF HINGED AT THE CENTER SPINE (Desktop) */}
                {flipState !== "idle" && peelingChapter && (
                  <div
                    className={`page-leaf-3d pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-1/2 lg:block ${
                      flipState === "next"
                        ? "animate-textbook-leaf-next"
                        : "animate-textbook-leaf-prev"
                    }`}
                  >
                    {/* FRONT FACE OF THE TURNING LEAF */}
                    <div className="page-face-front absolute inset-0 h-full w-full overflow-hidden">
                      <div className="animate-paper-arch h-full w-full">
                        {flipState === "next"
                          ? renderSingleRightPage(peelingChapter, peelingIdx)
                          : renderSingleRightPage(chapter, currentIdx)}
                      </div>
                      <div className="animate-leaf-front-shade pointer-events-none absolute inset-0" />
                    </div>

                    {/* BACK FACE OF THE TURNING LEAF */}
                    <div className="page-face-back absolute inset-0 h-full w-full overflow-hidden">
                      <div className="animate-paper-arch h-full w-full">
                        {flipState === "next"
                          ? renderSingleLeftPage(chapter, currentIdx)
                          : renderSingleLeftPage(peelingChapter, peelingIdx)}
                      </div>
                      <div className="animate-leaf-back-shade pointer-events-none absolute inset-0" />
                    </div>
                  </div>
                )}

                {/* Mobile Single-Page Turn Animation (< lg) */}
                {flipState !== "idle" && presTurningChapter && (
                  <div
                    className={`pointer-events-none absolute inset-0 z-20 lg:hidden ${
                      flipState === "next"
                        ? "animate-folio-sheet-next"
                        : "animate-folio-sheet-prev"
                    }`}
                  >
                    {renderMobileTextbookSpread(
                      presTurningChapter,
                      chapters.findIndex(
                        (c) => c.slug === presTurningChapter.slug
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Slide / Textbook Drawer (Съдържание на летописа) */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm">
          <div className="vintage-parchment flex h-full w-full max-w-md flex-col justify-between overflow-y-auto border-r-4 border-[#5a3518] p-6 text-[#26170a] shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b-2 border-double border-[#6b4423] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6e1a12]">
                    ❦ Исторически Летопис ❦
                  </span>
                  <h2 className="font-serif text-xl font-bold">{bookTitle}</h2>
                  <p className="text-xs italic text-[#5c3618]">
                    Съставили: {bookAuthor}
                  </p>
                </div>
                <button
                  onClick={() => setTocOpen(false)}
                  className="border border-[#6b4423] p-1 text-[#3d2512] hover:bg-[#e2cfa9]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#6e1a12]">
                  Съдържание на листовете ({chapters.length})
                </h3>
                <div className="mt-3 space-y-2.5">
                  {chapters.map((ch, idx) => {
                    const active = ch.slug === chapter.slug;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setTocOpen(false);
                          navigateToChapterWithFlip(ch.slug);
                        }}
                        className={`flex w-full items-center justify-between border-2 p-3 text-left transition ${
                          active
                            ? "border-[#4a180d] bg-gradient-to-r from-[#6e1a12] to-[#4e110b] font-bold text-[#f7efde] shadow"
                            : "border-[#8c6239] bg-[#f7efde] text-[#2b1d0e] hover:bg-[#e5d2ad]"
                        }`}
                      >
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest opacity-85">
                            Лист {ROMAN_NUMERALS[idx] || idx + 1} • Стр.{" "}
                            {idx * 2 + 1}–{idx * 2 + 2}
                          </span>
                          <span className="text-sm">
                            {ch.title || `Слайд ${idx + 1} (Празен лист)`}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#8c6239] pt-4 text-center text-xs italic text-[#523015]">
              ❦ Използвайте стрелките (← / →) или „Авто-смяна“ за плавно прелистване ❦
            </div>
          </div>
          <div className="flex-1" onClick={() => setTocOpen(false)} />
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-6 backdrop-blur-sm"
        >
          <div className="max-w-4xl text-center">
            <div className="antique-photo-frame inline-block p-3">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || "Преглед"}
                className="max-h-[78vh] object-contain sepia-[0.12]"
              />
            </div>
            {lightboxImage.caption && (
              <p className="mt-3 font-serif text-base italic text-[#f4ead5]">
                ❦ {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
