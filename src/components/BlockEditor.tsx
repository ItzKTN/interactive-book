"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Columns,
  Compass,
  Copy,
  Eraser,
  Eye,
  FilePlus2,
  FolderOpen,
  GripVertical,
  Heading1,
  Image as ImageIcon,
  Italic,
  Link2,
  ListCollapse,
  Loader2,
  Music,
  Plus,
  Presentation,
  Quote,
  Save,
  Scale,
  Scissors,
  Send,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";
import {
  BlockType,
  BookBlock,
  Chapter,
  ChoiceOption,
  FootnoteItem,
  MediaCategory,
  MediaItem,
} from "@/types/book";
import Navbar from "./Navbar";
import MediaPickerModal from "./MediaPickerModal";

interface BlockEditorProps {
  initialChapter: Chapter;
  allChapters: Chapter[];
  bookTitle: string;
}

const BLOCK_PALETTE: {
  type: BlockType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "paragraph",
    label: "Абзац (Текст)",
    desc: "Основен текст с бележки под линия и връзки",
    icon: <Type className="h-5 w-5 text-stone-600" />,
  },
  {
    type: "heading",
    label: "Заглавие (H1–H3)",
    desc: "Заглавие или подзаглавие в страницата",
    icon: <Heading1 className="h-5 w-5 text-amber-600" />,
  },
  {
    type: "image",
    label: "Снимка / Илюстрация",
    desc: "Вмъкване на снимка от /data с надпис",
    icon: <ImageIcon className="h-5 w-5 text-emerald-600" />,
  },
  {
    type: "choice",
    label: "Връзка към страница (Бутон)",
    desc: "Бутони за преход към други страници/слайдове",
    icon: <Compass className="h-5 w-5 text-rose-600" />,
  },
  {
    type: "collapsible",
    label: "Сгъваема архивна бележка",
    desc: "Разгъващо се каре за допълнителна информация",
    icon: <ListCollapse className="h-5 w-5 text-sky-600" />,
  },
  {
    type: "quote",
    label: "Цитат / Мото",
    desc: "Оформен възрожденски цитат с автор",
    icon: <Quote className="h-5 w-5 text-indigo-600" />,
  },
  {
    type: "media",
    label: "Аудио / Видео / Файл",
    desc: "Вграждане на аудио, видео или PDF от /data",
    icon: <Music className="h-5 w-5 text-purple-600" />,
  },
  {
    type: "code",
    label: "Документ / Телеграма",
    desc: "Текст в каре с моноширинен шрифт",
    icon: <Code2 className="h-5 w-5 text-teal-600" />,
  },
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

export default function BlockEditor({
  initialChapter,
  allChapters,
  bookTitle,
}: BlockEditorProps) {
  const router = useRouter();
  const safeInitial = initialChapter || allChapters[0] || FALLBACK_EMPTY_CHAPTER;
  const [chapter, setChapter] = useState<Chapter>(safeInitial);
  const [chapters, setChapters] = useState<Chapter[]>(
    allChapters.length > 0 ? allChapters : [safeInitial]
  );
  const [activeBlockId, setActiveBlockId] = useState<string | null>(
    safeInitial.blocks[0]?.id || null
  );

  useEffect(() => {
    // Always fetch latest chapters directly from server (bypasses Next.js client Router Cache)
    fetch("/api/chapters", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.chapters && data.chapters.length > 0) {
          setChapters(data.chapters);
          const currentMatch =
            data.chapters.find((c: Chapter) => c.slug === safeInitial.slug) ||
            data.chapters[0];
          setChapter(currentMatch);
          setActiveBlockId(currentMatch.blocks[0]?.id || null);
        }
      })
      .catch(() => {});
  }, [safeInitial.slug]);

  const handleSwitchChapter = (targetCh: Chapter) => {
    setChapter(targetCh);
    setActiveBlockId(targetCh.blocks[0]?.id || null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/${targetCh.slug}/edit`);
    }
  };
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [showAdvancedChoiceIds, setShowAdvancedChoiceIds] = useState<
    Record<string, boolean>
  >({});

  // Dual Editor Mode: "presentation" (1 слайд) vs "textbook" (Разтворен учебник: Лява + Дясна стр.)
  const [editorMode, setEditorMode] = useState<"presentation" | "textbook">(
    "presentation"
  );

  // Saving & status state
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Media picker modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTargetBlockId, setMediaTargetBlockId] = useState<string | null>(
    null
  );
  const [mediaTargetField, setMediaTargetField] = useState<
    "block" | "narrator"
  >("block");
  const [allowedMediaTypes, setAllowedMediaTypes] = useState<
    MediaCategory[] | undefined
  >(undefined);

  // New chapter modal
  const [newChapterModal, setNewChapterModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [startCompletelyBlank, setStartCompletelyBlank] = useState(true);

  // Visual Page Link Modal for inline text links
  const [linkModalBlockId, setLinkModalBlockId] = useState<string | null>(null);
  const [inlineLinkTargetSlug, setInlineLinkTargetSlug] = useState<string>(
    allChapters[0]?.slug || "prologue"
  );
  const [inlineLinkText, setInlineLinkText] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Block CRUD Helpers
  const updateBlock = (id: string, patch: Partial<BookBlock>) => {
    setChapter((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const addBlock = (type: BlockType, afterIndex?: number) => {
    const defaultTarget =
      chapters.find((c) => c.slug !== chapter.slug) || chapters[0];
    const newBlock: BookBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      content:
        type === "heading"
          ? ""
          : type === "quote"
          ? ""
          : type === "code"
          ? ""
          : type === "collapsible"
          ? ""
          : type === "choice"
          ? "Изберете страница:"
          : "",
      align: "left",
      level: type === "heading" ? 2 : undefined,
      collapsibleTitle:
        type === "collapsible" ? "Архивна бележка" : undefined,
      choicePrompt:
        type === "choice" ? "Към коя страница искате да преминете?" : undefined,
      choices:
        type === "choice"
          ? [
              {
                id: `chc-${Date.now()}`,
                label: defaultTarget
                  ? `Към: ${defaultTarget.title || defaultTarget.slug}`
                  : "Към следващата страница",
                description: "",
                targetSlug: defaultTarget?.slug || "prologue",
                setStateKey: "",
              },
            ]
          : undefined,
    };

    setChapter((prev) => {
      const nextBlocks = [...prev.blocks];
      const insertAt =
        afterIndex !== undefined ? afterIndex + 1 : nextBlocks.length;
      nextBlocks.splice(insertAt, 0, newBlock);
      return { ...prev, blocks: nextBlocks };
    });
    setActiveBlockId(newBlock.id);
  };

  // 1-Click Quick Page Linker: Adds a link button to any target chapter
  const addQuickPageLink = (targetCh: Chapter) => {
    const newChoiceOption: ChoiceOption = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label: `Към: ${targetCh.title || `Страница (${targetCh.slug})`}`,
      description: targetCh.subtitle || "",
      targetSlug: targetCh.slug,
    };

    setChapter((prev) => {
      const lastBlock = prev.blocks[prev.blocks.length - 1];
      // If the last block is already a Choice/Link block, append the button there
      if (lastBlock && lastBlock.type === "choice") {
        const updatedBlocks = [...prev.blocks];
        updatedBlocks[updatedBlocks.length - 1] = {
          ...lastBlock,
          choices: [...(lastBlock.choices || []), newChoiceOption],
        };
        return { ...prev, blocks: updatedBlocks };
      }

      // Otherwise create a new Choice/Link block at the bottom
      const newChoiceBlock: BookBlock = {
        id: `blk-${Date.now()}`,
        type: "choice",
        content: "Преход към страница:",
        choicePrompt: "Преминете към страница:",
        choices: [newChoiceOption],
      };
      return { ...prev, blocks: [...prev.blocks, newChoiceBlock] };
    });

    showToast(
      `Добавена е връзка към „${targetCh.title || targetCh.slug}“!`
    );
  };

  const duplicateBlock = (idx: number) => {
    const source = chapter.blocks[idx];
    if (!source) return;
    const copy: BookBlock = {
      ...JSON.parse(JSON.stringify(source)),
      id: `blk-${Date.now()}`,
    };
    setChapter((prev) => {
      const next = [...prev.blocks];
      next.splice(idx + 1, 0, copy);
      return { ...prev, blocks: next };
    });
    setActiveBlockId(copy.id);
  };

  // Allow removing all blocks so a page can be completely empty
  const removeBlock = (id: string) => {
    setChapter((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  };

  const clearAllBlocksOnPage = () => {
    if (
      !window.confirm(
        "Сигурни ли сте, че искате да изчистите всички блокове и заглавия от тази страница?"
      )
    ) {
      return;
    }
    setChapter((prev) => ({
      ...prev,
      title: "",
      subtitle: "",
      blocks: [],
      footnotes: [],
    }));
    showToast("Страницата вече е напълно празна.");
  };

  const moveBlock = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= chapter.blocks.length) return;
    setChapter((prev) => {
      const next = [...prev.blocks];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return { ...prev, blocks: next };
    });
  };

  // Rich Text Formatting Helpers for Active Block
  const wrapFormatting = (block: BookBlock, tag: "strong" | "em" | "code") => {
    updateBlock(block.id, {
      content: `${block.content} <${tag}>текст</${tag}>`,
    });
  };

  const openInlineLinkModal = (block: BookBlock) => {
    const defaultTarget =
      chapters.find((c) => c.slug !== chapter.slug) || chapters[0];
    setLinkModalBlockId(block.id);
    setInlineLinkTargetSlug(defaultTarget?.slug || "prologue");
    setInlineLinkText(
      defaultTarget?.title || defaultTarget?.slug || "Виж страницата"
    );
  };

  const handleConfirmInlineLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalBlockId) return;
    const targetBlock = chapter.blocks.find((b) => b.id === linkModalBlockId);
    if (!targetBlock) return;

    const href = inlineLinkTargetSlug.startsWith("/")
      ? inlineLinkTargetSlug
      : `/${inlineLinkTargetSlug}`;
    const label = inlineLinkText.trim() || href;

    updateBlock(targetBlock.id, {
      content: `${targetBlock.content} <a href="${href}" class="underline text-[#6e1a12] font-bold hover:opacity-80">${label}</a>`,
    });
    setLinkModalBlockId(null);
    showToast(`Вмъкната е връзка към ${href}`);
  };

  const insertFootnoteReference = (block: BookBlock) => {
    const nextNum = (chapter.footnotes?.length || 0) + 1;
    const noteText =
      window.prompt(
        `Въведете текст за бележка под линия [${nextNum}]:`,
        "Историческа справка."
      ) || "Историческа справка.";

    const newFn: FootnoteItem = {
      id: `fn-${Date.now()}`,
      number: nextNum,
      label: String(nextNum),
      content: noteText,
    };

    setChapter((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === block.id ? { ...b, content: `${b.content} [${nextNum}]` } : b
      ),
      footnotes: [...(prev.footnotes || []), newFn],
    }));
  };

  // Save Draft / Publish Handler -> POST /api/chapters
  const handleSaveChapter = async (targetStatus: "draft" | "published") => {
    setSavingStatus("saving");
    try {
      const payload: Chapter = {
        ...chapter,
        status: targetStatus,
      };
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.chapter) {
        setChapter(data.chapter);
        if (data.chapters) setChapters(data.chapters);
        setSavingStatus("saved");
        showToast(
          targetStatus === "published"
            ? `Страницата е публикувана успешно!`
            : `Черновата е запазена.`
        );
        setTimeout(() => setSavingStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSavingStatus("idle");
      showToast("Грешка при запазване на страницата.");
    }
  };

  // Delete Chapter / Page Handler -> DELETE /api/chapters?slug=...
  const handleDeleteChapter = async (slugToDelete: string, titleLabel?: string) => {
    try {
      const res = await fetch(
        `/api/chapters?slug=${encodeURIComponent(slugToDelete)}`,
        {
          method: "DELETE",
          cache: "no-store",
        }
      );
      const data = await res.json();
      if (data.chapters && data.chapters.length > 0) {
        setChapters(data.chapters);
        showToast(`Страницата „${titleLabel || slugToDelete}“ беше изтрита.`);
        const stillExists = data.chapters.find(
          (c: Chapter) => c.slug === chapter.slug
        );
        if (!stillExists || slugToDelete === chapter.slug) {
          const nextActive = data.chapters[0];
          setChapter(nextActive);
          setActiveBlockId(nextActive.blocks[0]?.id || null);
          if (typeof window !== "undefined") {
            window.history.pushState(null, "", `/${nextActive.slug}/edit`);
          }
        }
      }
    } catch (error) {
      console.error("Delete chapter error:", error);
      showToast("Грешка при изтриване на страницата.");
    }
  };

  // Clear ALL chapters and start with 1 completely blank page
  const handleClearAllChapters = async () => {
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "clear_all" }),
      });
      const data = await res.json();
      if (data.chapters && data.chapters.length > 0) {
        const nextActive = data.chapters[0];
        setChapters(data.chapters);
        setChapter(nextActive);
        setActiveBlockId(null);
        showToast("Всички страници бяха изтрити! Започвате от чиста празна страница.");
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", `/${nextActive.slug}/edit`);
        }
      }
    } catch (error) {
      console.error("Clear all chapters error:", error);
      showToast("Грешка при изчистване на страниците.");
    }
  };

  // Restore the 5 original Konstantin Fotinov slides
  const handleRestoreDefaultSeed = async () => {
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "reset_seed" }),
      });
      const data = await res.json();
      if (data.chapters && data.chapters.length > 0) {
        const nextActive = data.chapters[0];
        setChapters(data.chapters);
        setChapter(nextActive);
        setActiveBlockId(nextActive.blocks[0]?.id || null);
        showToast("10-те слайда за К. Фотинов бяха възстановени!");
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", `/${nextActive.slug}/edit`);
        }
      }
    } catch (error) {
      console.error("Restore seed error:", error);
      showToast("Грешка при възстановяване на слайдовете.");
    }
  };

  // Create New Page / Slide (Blank by default!)
  const handleCreateNewChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackSlug = `stranitsa-${chapters.length + 1}-${Date.now()
      .toString()
      .slice(-4)}`;
    const rawSlug = newSlug.trim() || newTitle.trim() || fallbackSlug;

    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        title: newTitle.trim(),
        slug: rawSlug,
        subtitle: "",
        order: chapters.length + 1,
        status: "published",
        blocks: startCompletelyBlank
          ? []
          : [
              {
                id: `blk-${Date.now()}`,
                type: "heading",
                level: 1,
                content: newTitle.trim() || "Заглавие",
                align: "center",
              },
              {
                id: `blk-${Date.now() + 1}`,
                type: "paragraph",
                content: "",
                align: "left",
              },
            ],
        footnotes: [],
      }),
    });
    const data = await res.json();
    if (data.chapter) {
      if (data.chapters) setChapters(data.chapters);
      setChapter(data.chapter);
      setActiveBlockId(data.chapter.blocks[0]?.id || null);
      setNewChapterModal(false);
      setNewTitle("");
      setNewSlug("");
      showToast("Създадена е нова страница!");
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `/${data.chapter.slug}/edit`);
      }
    }
  };

  // Instant 1-Click Blank Page creation
  const handleQuickCreateBlankPage = async () => {
    const nextNum = chapters.length + 1;
    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        title: "",
        slug: `stranitsa-${nextNum}-${Date.now().toString().slice(-4)}`,
        subtitle: "",
        order: nextNum,
        status: "published",
        blocks: [],
        footnotes: [],
      }),
    });
    const data = await res.json();
    if (data.chapter) {
      if (data.chapters) setChapters(data.chapters);
      setChapter(data.chapter);
      setActiveBlockId(null);
      showToast("Създадена е нова празна страница!");
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `/${data.chapter.slug}/edit`);
      }
    }
  };

  // =========================================================================
  // DUAL-MODE CAPACITY & PAGE-BREAK INDICATOR LOGIC
  // =========================================================================
  const currentChapterIdx = Math.max(
    0,
    chapters.findIndex((c) => c.slug === chapter.slug)
  );
  const leftPageNum = currentChapterIdx * 2 + 1;
  const rightPageNum = currentChapterIdx * 2 + 2;

  // Estimate how much vertical screen/page percentage a single block takes
  const estimateBlockHeightPercent = (
    block: BookBlock,
    mode: "presentation" | "textbook"
  ): number => {
    const plainLen = (block.content || "").replace(/<[^>]+>/g, "").length;
    if (block.type === "image") {
      const layout =
        block.imageLayout ||
        (block.imageSize === "full" ? "full-page" : "center");
      const size =
        block.imageSize || (layout === "full-page" ? "full" : "medium");

      if (layout === "full-page" || size === "full") {
        return mode === "presentation" ? 58 : 65;
      }
      if (layout === "float-left" || layout === "float-right") {
        if (plainLen > 0) {
          // Side-by-side image + inline companion paragraph
          const textPct =
            mode === "presentation"
              ? Math.max(18, Math.ceil(plainLen / 75) * 6 + 6)
              : Math.max(22, Math.ceil(plainLen / 50) * 7 + 8);
          const imgPct = size === "small" ? 20 : size === "large" ? 34 : 26;
          return Math.max(textPct, imgPct);
        }
        // Floated beside an adjacent paragraph block — adds minimal extra vertical height
        return size === "large" ? 18 : 10;
      }
      // Centered standalone image
      if (size === "small") return mode === "presentation" ? 18 : 22;
      if (size === "large") return mode === "presentation" ? 42 : 48;
      return mode === "presentation" ? 30 : 36;
    }

    if (mode === "presentation") {
      switch (block.type) {
        case "heading":
          return block.level === 1 ? 12 : 9;
        case "paragraph":
          return Math.max(12, Math.ceil(plainLen / 95) * 6 + 6);
        case "quote":
          return Math.max(14, Math.ceil(plainLen / 85) * 6 + 8);
        case "media":
          return 30;
        case "collapsible":
          return 14;
        case "code":
          return Math.max(18, Math.ceil(plainLen / 75) * 6 + 10);
        case "choice":
          return 12 + (block.choices?.length || 1) * 5;
        default:
          return 15;
      }
    } else {
      // Textbook half-spread page is narrower, so blocks take slightly more vertical %
      switch (block.type) {
        case "heading":
          return block.level === 1 ? 15 : 11;
        case "paragraph":
          return Math.max(15, Math.ceil(plainLen / 65) * 7 + 7);
        case "quote":
          return Math.max(17, Math.ceil(plainLen / 60) * 7 + 9);
        case "media":
          return 36;
        case "collapsible":
          return 16;
        case "code":
          return Math.max(22, Math.ceil(plainLen / 55) * 7 + 12);
        case "choice":
          return 15 + (block.choices?.length || 1) * 6;
        default:
          return 18;
      }
    }
  };

  // Resolve each block's textbook page side ("left" | "right") matching InteractiveReader
  const getResolvedBlockSides = (blocks: BookBlock[]): ("left" | "right")[] => {
    const nonChoice = blocks.filter((b) => b.type !== "choice");
    const splitPt = Math.max(1, Math.ceil(nonChoice.length / 2));
    let nonChoiceSeen = 0;

    return blocks.map((b) => {
      if (b.pageSide === "left" || b.pageSide === "right") {
        if (b.type !== "choice") nonChoiceSeen++;
        return b.pageSide;
      }
      if (b.type === "choice") {
        return "right";
      }
      const side = nonChoiceSeen < splitPt ? "left" : "right";
      nonChoiceSeen++;
      return side;
    });
  };

  const resolvedSides = getResolvedBlockSides(chapter.blocks);

  // Assign a block explicitly to Left or Right page in Textbook Mode (keeping Left blocks before Right blocks)
  const setBlockPageSide = (blockId: string, targetSide: "left" | "right") => {
    setChapter((prev) => {
      const currentSides = getResolvedBlockSides(prev.blocks);
      const updated = prev.blocks.map((b, i) => ({
        ...b,
        pageSide: b.id === blockId ? targetSide : currentSides[i],
      }));
      const leftBlocks = updated.filter((b) => b.pageSide === "left");
      const rightBlocks = updated.filter((b) => b.pageSide === "right");
      return {
        ...prev,
        blocks: [...leftBlocks, ...rightBlocks],
      };
    });
    showToast(
      targetSide === "left"
        ? `Блокът е преместен в Лява страница (Стр. ${leftPageNum})`
        : `Блокът е преместен в Дясна страница (Стр. ${rightPageNum})`
    );
  };

  // Auto-balance blocks between Left and Right textbook pages by height
  const autoBalanceTextbookPages = () => {
    setChapter((prev) => {
      if (prev.blocks.length === 0) return prev;
      const headerPct = prev.title || prev.subtitle ? 18 : 0;
      const totalBlockPct = prev.blocks.reduce(
        (acc, b) => acc + estimateBlockHeightPercent(b, "textbook"),
        0
      );
      const targetLeftPct = (headerPct + totalBlockPct) / 2;

      let runningLeft = headerPct;
      const updated = prev.blocks.map((b, idx) => {
        if (b.type === "choice") {
          return { ...b, pageSide: "right" as const };
        }
        const h = estimateBlockHeightPercent(b, "textbook");
        if (idx === 0 || runningLeft + h * 0.55 <= Math.max(targetLeftPct, 55)) {
          runningLeft += h;
          return { ...b, pageSide: "left" as const };
        }
        return { ...b, pageSide: "right" as const };
      });

      const leftBlocks = updated.filter((b) => b.pageSide === "left");
      const rightBlocks = updated.filter((b) => b.pageSide === "right");
      return {
        ...prev,
        blocks: [...leftBlocks, ...rightBlocks],
      };
    });
    showToast("Страниците на учебника са автоматично балансирани!");
  };

  // Presentation Mode Cumulative Height & Overflow Index
  const presHeaderPct = chapter.title || chapter.subtitle ? 14 : 0;
  let presRunningPct = presHeaderPct;
  const presCumulativePcts: number[] = [];
  let presOverflowFirstIndex = -1;

  chapter.blocks.forEach((b, idx) => {
    const h = estimateBlockHeightPercent(b, "presentation");
    presRunningPct += h;
    presCumulativePcts.push(presRunningPct);
    if (presRunningPct > 100 && presOverflowFirstIndex === -1 && idx > 0) {
      presOverflowFirstIndex = idx;
    }
  });
  const totalPresPct = presRunningPct;

  // Textbook Mode Left & Right Page Cumulative Heights
  const textbookLeftHeaderPct = chapter.title || chapter.subtitle ? 18 : 0;
  let leftRunningPct = textbookLeftHeaderPct;
  let rightRunningPct =
    chapter.footnotes && chapter.footnotes.length > 0 ? 14 : 0;
  let leftOverflowFirstBlockId: string | null = null;
  let rightOverflowFirstBlockId: string | null = null;
  const blockCumulativeBySide: Record<string, number> = {};

  chapter.blocks.forEach((b, idx) => {
    const side = resolvedSides[idx];
    const h = estimateBlockHeightPercent(b, "textbook");
    if (side === "left") {
      leftRunningPct += h;
      blockCumulativeBySide[b.id] = leftRunningPct;
      if (leftRunningPct > 100 && !leftOverflowFirstBlockId) {
        leftOverflowFirstBlockId = b.id;
      }
    } else {
      rightRunningPct += h;
      blockCumulativeBySide[b.id] = rightRunningPct;
      if (rightRunningPct > 100 && !rightOverflowFirstBlockId) {
        rightOverflowFirstBlockId = b.id;
      }
    }
  });

  // First index where Textbook transitions from Left Page to Right Page
  const firstRightBlockIndex = resolvedSides.findIndex((s) => s === "right");

  // 1-Click Split: Move overflowing blocks from `splitFromIdx` onward into a brand-new Slide/Page
  const handleSplitBlocksToNewPage = async (splitFromIdx: number) => {
    if (splitFromIdx <= 0 || splitFromIdx >= chapter.blocks.length) return;
    const keptBlocks = chapter.blocks.slice(0, splitFromIdx);
    const movedBlocks = chapter.blocks
      .slice(splitFromIdx)
      .map((b) => ({ ...b, pageSide: undefined }));

    setSavingStatus("saving");
    try {
      // 1. Save trimmed current chapter
      const updatedCurrent: Chapter = {
        ...chapter,
        blocks: keptBlocks,
        status: "published",
      };
      await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(updatedCurrent),
      });

      // 2. Create new chapter with the overflowing blocks
      const nextNum = chapters.length + 1;
      const newPageTitle = chapter.title
        ? `${chapter.title} (Продължение)`
        : `Страница ${nextNum}`;
      const newPageSlug = `${chapter.slug}-prod-${Date.now()
        .toString()
        .slice(-3)}`;

      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          title: newPageTitle,
          slug: newPageSlug,
          subtitle: chapter.subtitle || "Продължение на темата",
          order: (chapter.order || currentChapterIdx + 1) + 1,
          status: "published",
          blocks: movedBlocks,
          footnotes: [],
        }),
      });
      const data = await res.json();
      setSavingStatus("idle");

      if (data.chapters) {
        setChapters(data.chapters);
      }
      setChapter(updatedCurrent);
      showToast(
        `Прехвърлени са ${movedBlocks.length} блока в нова страница „${newPageTitle}“!`
      );
    } catch (e) {
      console.error("Split blocks error:", e);
      setSavingStatus("idle");
      showToast("Грешка при прехвърляне в нова страница.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-28 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar currentSlug={chapter.slug} bookTitle={bookTitle} />

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed right-6 top-16 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white shadow-xl">
          <Check className="h-5 w-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-12">
        {/* Left Sidebar: Pages List, Quick Page Linker & Page Settings */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Pages / Slides Switcher with Delete & Blank Page Buttons */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300">
                Страници / Слайдове ({chapters.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickCreateBlankPage}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300"
                  title="Създай напълно празна нова страница с 1 клик"
                >
                  <Plus className="h-4 w-4" /> Празна
                </button>
                <button
                  type="button"
                  onClick={() => setNewChapterModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500"
                >
                  <FilePlus2 className="h-4 w-4" /> Нова страница
                </button>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              {chapters.map((ch, idx) => {
                const isCurrent = ch.slug === chapter.slug;
                return (
                  <div
                    key={ch.id}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm transition ${
                      isCurrent
                        ? "bg-stone-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-stone-50 text-stone-800 hover:bg-stone-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSwitchChapter(ch)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <span className="shrink-0 font-mono text-xs font-bold opacity-70">
                        #{idx + 1}
                      </span>
                      <span className="truncate text-sm sm:text-base">
                        {ch.title || `Празна страница (/${ch.slug})`}
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(
                            ch.slug,
                            ch.title || `Страница #${idx + 1}`
                          );
                        }}
                        title="Изтрий тази страница веднага"
                        className={`rounded-lg p-1.5 transition ${
                          isCurrent
                            ? "text-rose-300 hover:bg-rose-600 hover:text-white"
                            : "text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-stone-200 pt-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleClearAllChapters}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-600 hover:text-white dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                <span>Изтрий всички страници (Започни начисто)</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreDefaultSeed}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Възстанови 10-те слайда за К. Фотинов</span>
              </button>
            </div>
          </div>

          {/* 1-CLICK PAGE LINKER (Бързо свързване между страниците) */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-50/40 p-5 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/10">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              <Link2 className="h-4 w-4" />
              <span>Бърза връзка към друга страница</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-700 dark:text-zinc-300">
              Натиснете върху страница по-долу, за да добавите веднага бутон за преход към нея в края на текущата страница:
            </p>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {chapters.map((targetCh, idx) => (
                <button
                  key={targetCh.id}
                  type="button"
                  onClick={() => addQuickPageLink(targetCh)}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-600/40 bg-white px-3 py-2 text-left text-sm font-semibold text-stone-800 shadow-sm transition hover:border-amber-600 hover:bg-amber-600 hover:text-white dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-amber-600"
                >
                  <Plus className="h-4 w-4 shrink-0 text-amber-600 group-hover:text-white" />
                  <span className="truncate max-w-[220px]">
                    Слайд {idx + 1}: {targetCh.title || targetCh.slug}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Insert Block Palette */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300">
              Добави елемент (Блок)
            </h3>
            <div className="mt-3.5 grid grid-cols-1 gap-2.5">
              {BLOCK_PALETTE.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addBlock(item.type)}
                  className="flex items-center gap-3.5 rounded-xl border border-stone-200/80 p-3 text-left transition hover:border-amber-500 hover:bg-amber-50/40 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-zinc-100">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-stone-600 dark:text-zinc-400">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Page Settings & Delete Page Inspector */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300">
              Настройки на страницата
            </h3>

            <div className="mt-3.5 space-y-3.5 text-sm">
              <div>
                <label className="font-semibold text-stone-700 dark:text-zinc-300">
                  Адрес (URL Slug)
                </label>
                <input
                  type="text"
                  value={chapter.slug}
                  onChange={(e) =>
                    setChapter((p) => ({ ...p, slug: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-zinc-300">
                  Аудио файл за диктор (/data URL)
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    placeholder="/uploads/narration.mp3"
                    value={chapter.narratorAudioUrl || ""}
                    onChange={(e) =>
                      setChapter((p) => ({
                        ...p,
                        narratorAudioUrl: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTargetField("narrator");
                      setAllowedMediaTypes(["audio"]);
                      setMediaModalOpen(true);
                    }}
                    className="shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    title="Избери аудио от /data"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-3.5 flex flex-col gap-2.5 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={clearAllBlocksOnPage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Eraser className="h-4 w-4" />
                  <span>Изчисти съдържанието (Празна страница)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteChapter(
                      chapter.slug,
                      chapter.title || chapter.slug
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-600 hover:text-white dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Изтрий тази страница</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Gutenberg Block Canvas */}
        <section className="lg:col-span-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            {/* =================================================================
                DUAL EDITOR MODE SWITCHER & LIVE PAGE CAPACITY METER
               ================================================================= */}
            <div className="mb-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-50/80 via-stone-50 to-amber-100/40 p-4 shadow-sm dark:border-amber-500/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Режим на подредба в редактора
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-zinc-100">
                    {editorMode === "presentation"
                      ? `📽️ Режим Презентация — Слайд #${currentChapterIdx + 1}`
                      : `📖 Режим Учебник — Разтвор Стр. ${leftPageNum} и Стр. ${rightPageNum}`}
                  </h3>
                </div>

                {/* Mode Switcher Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-300 bg-white p-1 shadow-inner dark:border-zinc-700 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setEditorMode("presentation")}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
                      editorMode === "presentation"
                        ? "bg-amber-600 text-white shadow"
                        : "text-stone-700 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Presentation className="h-4 w-4" />
                    <span>Режим Презентация</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode("textbook")}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
                      editorMode === "textbook"
                        ? "bg-amber-600 text-white shadow"
                        : "text-stone-700 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Режим Учебник (2 стр.)</span>
                  </button>
                </div>
              </div>

              {/* LIVE CAPACITY METERS */}
              {editorMode === "presentation" ? (
                <div className="mt-4 rounded-xl border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-bold text-stone-800 dark:text-zinc-200">
                      Запълване на слайда (1 екран = 100%):{" "}
                      <span
                        className={
                          totalPresPct > 100
                            ? "text-rose-600 dark:text-rose-400"
                            : totalPresPct > 85
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {totalPresPct}%
                      </span>
                    </span>

                    {totalPresPct <= 100 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                        Събира се на 1 слайд без скролване
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Надхвърля 1 слайд ({totalPresPct}%) — отива в следваща страница!
                        </span>
                        {presOverflowFirstIndex > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSplitBlocksToNewPage(presOverflowFirstIndex)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-rose-500"
                          >
                            <Scissors className="h-3.5 w-3.5" />
                            <span>Прехвърли излишните блокове в нова страница</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar with 100% Page Break Marker */}
                  <div className="relative mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalPresPct > 100
                          ? "bg-rose-600"
                          : totalPresPct > 85
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, totalPresPct)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-zinc-300">
                      В режим <strong>Учебник</strong> всеки слайд се разгръща на{" "}
                      <strong>Лява страница (Стр. {leftPageNum})</strong> и{" "}
                      <strong>Дясна страница (Стр. {rightPageNum})</strong>. Можете да избирате за всеки блок на коя страница да стои:
                    </p>
                    <button
                      type="button"
                      onClick={autoBalanceTextbookPages}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600 bg-amber-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-amber-900 shadow-sm hover:bg-amber-600 hover:text-white dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      <Scale className="h-4 w-4" />
                      <span>Авто-балансирай Лява и Дясна стр.</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Left Page Meter */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span>⬅️ Лява страница (Стр. {leftPageNum})</span>
                        <span
                          className={
                            leftRunningPct > 100
                              ? "text-rose-600"
                              : leftRunningPct > 85
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }
                        >
                          {leftRunningPct}%
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
                        <div
                          className={`h-full transition-all ${
                            leftRunningPct > 100
                              ? "bg-rose-600"
                              : leftRunningPct > 85
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, leftRunningPct)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-stone-500 dark:text-zinc-400">
                        {leftRunningPct > 100
                          ? "⚠️ Прелива! Преместете долния блок в Дясна страница ➡️"
                          : "✓ Побира се отлично в Лява страница"}
                      </p>
                    </div>

                    {/* Right Page Meter */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span>Дясна страница ➡️ (Стр. {rightPageNum})</span>
                        <span
                          className={
                            rightRunningPct > 100
                              ? "text-rose-600"
                              : rightRunningPct > 85
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }
                        >
                          {rightRunningPct}%
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
                        <div
                          className={`h-full transition-all ${
                            rightRunningPct > 100
                              ? "bg-rose-600"
                              : rightRunningPct > 85
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(100, rightRunningPct)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-stone-500 dark:text-zinc-400">
                        {rightRunningPct > 100
                          ? "⚠️ Прелива в следващ лист на учебника!"
                          : "✓ Побира се отлично в Дясна страница"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chapter Title & Subtitle Editable Header (Optional - can be left blank!) */}
            <div className="mb-8 border-b border-stone-200 pb-6 dark:border-zinc-800">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {editorMode === "textbook"
                    ? `Заглавно каре в началото на Лява страница (Стр. ${leftPageNum})`
                    : `Заглавие на Слайд #${currentChapterIdx + 1}`}
                </span>
                <span className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400">
                  Заглавието и блоковете не са задължителни — страницата може да бъде оставена и празна
                </span>
              </div>

              <input
                type="text"
                value={chapter.title}
                onChange={(e) =>
                  setChapter((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Заглавие на страницата (оставете празно, ако не желаете заглавие)..."
                className="w-full bg-transparent font-serif text-2xl font-bold tracking-tight focus:outline-none sm:text-4xl"
              />
              <input
                type="text"
                value={chapter.subtitle || ""}
                onChange={(e) =>
                  setChapter((p) => ({ ...p, subtitle: e.target.value }))
                }
                placeholder="Подзаглавие (по желание)..."
                className="mt-2.5 w-full bg-transparent font-serif text-lg italic text-stone-600 focus:outline-none dark:text-zinc-400 sm:text-xl"
              />
            </div>

            {/* Empty Page State when chapter.blocks.length === 0 */}
            {chapter.blocks.length === 0 ? (
              <div className="my-8 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/70 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="font-serif text-xl font-bold text-stone-800 dark:text-zinc-200">
                  Тази страница в момента е празна (няма добавени блокове).
                </p>
                <p className="mt-2 text-sm text-stone-600 dark:text-zinc-400">
                  Можете да я запазите празна чрез бутона <strong>Публикувай (Запази)</strong> отдолу или да добавите първия елемент:
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => addBlock("paragraph")}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <Type className="h-4 w-4" /> + Добави Текст
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("image")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    <ImageIcon className="h-4 w-4" /> + Добави Снимка
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("choice")}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
                  >
                    <Compass className="h-4 w-4" /> + Добави Връзка към страница
                  </button>
                </div>
              </div>
            ) : (
              /* Blocks List with Live Page-Break / Next-Page Indicators */
              <div className="space-y-5">
                {editorMode === "textbook" && firstRightBlockIndex !== 0 && (
                  <div className="flex items-center justify-between rounded-xl border-2 border-amber-600/40 bg-amber-50/70 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    <span>
                      ⬅️ НАЧАЛО НА ЛЯВА СТРАНИЦА В УЧЕБНИКА (Стр. {leftPageNum})
                    </span>
                    <span>Капацитет: {leftRunningPct}%</span>
                  </div>
                )}

                {chapter.blocks.map((block, index) => {
                  const isSelected = activeBlockId === block.id;
                  const blockSide = resolvedSides[index];
                  const blockEstPct = estimateBlockHeightPercent(
                    block,
                    editorMode
                  );
                  const blockCumPct =
                    editorMode === "presentation"
                      ? presCumulativePcts[index]
                      : blockCumulativeBySide[block.id];

                  const isPresOverflowStart =
                    editorMode === "presentation" &&
                    index === presOverflowFirstIndex;

                  const isTextbookRightPageStart =
                    editorMode === "textbook" &&
                    index === firstRightBlockIndex;

                  const isLeftOverflowStart =
                    editorMode === "textbook" &&
                    block.id === leftOverflowFirstBlockId;

                  const isRightOverflowStart =
                    editorMode === "textbook" &&
                    block.id === rightOverflowFirstBlockId;

                  return (
                    <React.Fragment key={block.id}>
                      {/* 1. PRESENTATION MODE: NEXT-PAGE / SCREEN OVERFLOW INDICATOR */}
                      {isPresOverflowStart && (
                        <div className="my-6 rounded-2xl border-2 border-dashed border-rose-500 bg-rose-50/90 p-4 shadow-md dark:border-rose-500/80 dark:bg-rose-950/40">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
                              <div>
                                <p className="text-sm sm:text-base font-bold text-rose-800 dark:text-rose-200">
                                  ⚠️ ГРАНИЦА НА СЛАЙДА (Над 100% височина на екрана) — Отива в друга страница!
                                </p>
                                <p className="mt-0.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                                  Блоковете оттук надолу излизат извън рамката на един слайд и ще изискват скролване. За по-добра подредба можете да ги прехвърлите в нов слайд с 1 клик:
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSplitBlocksToNewPage(index)}
                              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-rose-500"
                            >
                              <Scissors className="h-4 w-4" />
                              <span>
                                Прехвърли блоковете оттук надолу в нова страница
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. TEXTBOOK MODE: LEFT PAGE OVERFLOW INDICATOR */}
                      {isLeftOverflowStart && (
                        <div className="my-5 rounded-2xl border-2 border-dashed border-rose-500 bg-rose-50/90 p-4 shadow-sm dark:bg-rose-950/40">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                              <span className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-200">
                                ⚠️ КРАЙ НА ЛЯВА СТРАНИЦА (Над 100%): Този блок прелива от Лява страница (Стр. {leftPageNum}) и трябва да премине в Дясна страница (Стр. {rightPageNum})!
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setBlockPageSide(block.id, "right")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-amber-500"
                            >
                              <span>Премести в Дясна страница (Стр. {rightPageNum})</span>
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. TEXTBOOK MODE: VISUAL BOUNDARY BETWEEN LEFT PAGE AND RIGHT PAGE */}
                      {isTextbookRightPageStart && (
                        <div className="my-7 rounded-2xl border-2 border-amber-600 bg-gradient-to-r from-amber-100/90 via-amber-50 to-amber-100/90 p-4 shadow-md dark:border-amber-500/60 dark:from-amber-950/50 dark:via-zinc-900 dark:to-amber-950/50">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow">
                                <Columns className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="block text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">
                                  ─── ❦ СРЕДНА СГЪВКА НА УЧЕБНИКА (НОВА СТРАНИЦА) ❦ ───
                                </span>
                                <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-zinc-100">
                                  Край на Лява страница (Стр. {leftPageNum}) ➔ Начало на ДЯСНА СТРАНИЦА (Стр. {rightPageNum})
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setBlockPageSide(block.id, "left")}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-700/40 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-amber-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200"
                                title="Премести първия десен блок обратно в Лява страница"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                                <span>Прехвърли този блок в Лява стр.</span>
                              </button>
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBlockPageSide(
                                      chapter.blocks[index - 1].id,
                                      "right"
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-700/40 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-amber-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200"
                                  title="Премести последния ляв блок в Дясна страница"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                  <span>Прехвърли горния блок в Дясна стр.</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. TEXTBOOK MODE: RIGHT PAGE OVERFLOW INTO NEXT SPREAD */}
                      {isRightOverflowStart && (
                        <div className="my-5 rounded-2xl border-2 border-dashed border-rose-500 bg-rose-50/90 p-4 shadow-sm dark:bg-rose-950/40">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                              <span className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-200">
                                ⚠️ ГРАНИЦА НА ДЯСНА СТРАНИЦА (Над 100%): Блоковете оттук надолу не се побират в Стр. {rightPageNum} и отиват за следващ лист (Стр. {rightPageNum + 1})!
                              </span>
                            </div>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSplitBlocksToNewPage(index)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-rose-500"
                              >
                                <Scissors className="h-4 w-4" />
                                <span>Прехвърли в нов лист на учебника</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div
                        draggable
                        onDragStart={() => setDraggedIdx(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedIdx !== null && draggedIdx !== index) {
                            moveBlock(draggedIdx, index);
                          }
                          setDraggedIdx(null);
                        }}
                        onClick={() => setActiveBlockId(block.id)}
                        className={`group relative rounded-2xl border p-4 sm:p-5 transition ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 dark:bg-amber-950/10"
                            : blockCumPct > 100
                            ? "border-rose-300 bg-rose-50/15 dark:border-rose-900/50"
                            : "border-stone-200/80 hover:border-stone-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        {/* Floating Block Toolbar */}
                        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/70 pb-2.5 text-sm dark:border-zinc-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="cursor-grab rounded p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800"
                              title="Провлачете за пренареждане"
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>

                            <select
                              value={block.type}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  type: e.target.value as BlockType,
                                })
                              }
                              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-bold tracking-wide text-stone-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                              <option value="paragraph">Абзац (Текст)</option>
                              <option value="heading">Заглавие</option>
                              <option value="image">Снимка</option>
                              <option value="choice">Връзка към страница</option>
                              <option value="collapsible">Архивна бележка</option>
                              <option value="quote">Цитат</option>
                              <option value="media">Аудио / Видео</option>
                              <option value="code">Документ / Код</option>
                            </select>

                            {/* Textbook Left / Right Page Switcher Pill on every block */}
                            {editorMode === "textbook" && (
                              <div className="flex items-center rounded-lg border border-amber-500/50 bg-amber-50/60 p-0.5 dark:bg-zinc-900">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBlockPageSide(block.id, "left");
                                  }}
                                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                                    blockSide === "left"
                                      ? "bg-amber-600 text-white shadow-sm"
                                      : "text-stone-600 hover:text-stone-900 dark:text-zinc-400"
                                  }`}
                                  title={`Постави този блок на Лява страница (Стр. ${leftPageNum})`}
                                >
                                  ⬅️ Лява (Стр. {leftPageNum})
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBlockPageSide(block.id, "right");
                                  }}
                                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                                    blockSide === "right"
                                      ? "bg-amber-600 text-white shadow-sm"
                                      : "text-stone-600 hover:text-stone-900 dark:text-zinc-400"
                                  }`}
                                  title={`Постави този блок на Дясна страница (Стр. ${rightPageNum})`}
                                >
                                  Дясна (Стр. {rightPageNum}) ➡️
                                </button>
                              </div>
                            )}

                            {/* Live Block Height & Cumulative Position Indicator Badge */}
                            <span
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                blockCumPct > 100
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                  : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                              title="Приблизителен обем на блока и докъде стига страницата след него"
                            >
                              ~{blockEstPct}% (общо {blockCumPct}%)
                            </span>

                            {block.type === "heading" && (
                              <div className="flex items-center rounded-lg border border-stone-200 p-0.5 dark:border-zinc-700">
                                {([1, 2, 3] as const).map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() =>
                                      updateBlock(block.id, { level: lvl })
                                    }
                                    className={`rounded px-2.5 py-1 text-sm font-bold ${
                                      (block.level || 1) === lvl
                                        ? "bg-amber-600 text-white"
                                        : "text-stone-500"
                                    }`}
                                  >
                                    H{lvl}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Rich Text Formatting Actions */}
                            {(block.type === "paragraph" ||
                              block.type === "heading" ||
                              block.type === "quote" ||
                              block.type === "collapsible" ||
                              (block.type === "image" &&
                                (block.imageLayout === "float-left" ||
                                  block.imageLayout === "float-right"))) && (
                              <div className="flex items-center gap-1 border-l border-stone-200 pl-2.5 dark:border-zinc-700">
                                <button
                                  type="button"
                                  onClick={() => wrapFormatting(block, "strong")}
                                  className="rounded p-1.5 hover:bg-stone-200 dark:hover:bg-zinc-800"
                                  title="Удебелен текст (Bold)"
                                >
                                  <Bold className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => wrapFormatting(block, "em")}
                                  className="rounded p-1.5 hover:bg-stone-200 dark:hover:bg-zinc-800"
                                  title="Наклонен текст (Italic)"
                                >
                                  <Italic className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openInlineLinkModal(block)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs sm:text-sm font-semibold text-amber-800 hover:bg-amber-600 hover:text-white dark:text-amber-300"
                                  title="Вмъкни връзка към друга страница"
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                  <span>+Връзка</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertFootnoteReference(block)}
                                  className="rounded-lg bg-stone-200/70 px-2.5 py-1 font-mono text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-800 hover:text-white dark:bg-zinc-800 dark:text-zinc-300"
                                  title="Добави бележка под линия [n]"
                                >
                                  +[бел.]
                                </button>
                              </div>
                            )}

                            {/* Alignment Controls */}
                            <div className="flex items-center gap-1 border-l border-stone-200 pl-2.5 dark:border-zinc-700">
                              {(["left", "center", "right"] as const).map(
                                (al) => (
                                  <button
                                    key={al}
                                    type="button"
                                    onClick={() =>
                                      updateBlock(block.id, { align: al })
                                    }
                                    className={`rounded p-1.5 ${
                                      (block.align || "left") === al
                                        ? "bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                        : "text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800"
                                    }`}
                                  >
                                    {al === "left" ? (
                                      <AlignLeft className="h-4 w-4" />
                                    ) : al === "center" ? (
                                      <AlignCenter className="h-4 w-4" />
                                    ) : (
                                      <AlignRight className="h-4 w-4" />
                                    )}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Block Order & Delete Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveBlock(index, index - 1)}
                              disabled={index === 0}
                              className="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                              title="Премести нагоре"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, index + 1)}
                              disabled={index === chapter.blocks.length - 1}
                              className="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                              title="Премести надолу"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateBlock(index)}
                              className="rounded p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800"
                              title="Дублирай блока"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Изтрий блока"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                      {/* Block Type Specific Editor UI */}
                      {block.type === "paragraph" && (
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={(e) =>
                            updateBlock(block.id, { content: e.target.value })
                          }
                          placeholder="Въведете текст тук..."
                          className="w-full resize-y bg-transparent font-serif text-lg sm:text-xl leading-relaxed focus:outline-none"
                        />
                      )}

                      {block.type === "heading" && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) =>
                            updateBlock(block.id, { content: e.target.value })
                          }
                          placeholder="Въведете заглавие..."
                          className="w-full bg-transparent font-serif text-2xl sm:text-3xl font-bold focus:outline-none"
                        />
                      )}

                      {block.type === "quote" && (
                        <div className="space-y-2 border-l-4 border-amber-500 pl-4">
                          <textarea
                            rows={2}
                            value={block.content}
                            onChange={(e) =>
                              updateBlock(block.id, { content: e.target.value })
                            }
                            placeholder="Текст на цитата..."
                            className="w-full bg-transparent font-serif text-lg sm:text-xl italic focus:outline-none"
                          />
                          <input
                            type="text"
                            value={block.quoteAuthor || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                quoteAuthor: e.target.value,
                              })
                            }
                            placeholder="— Автор / Източник на цитата"
                            className="w-full bg-transparent text-sm font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 focus:outline-none"
                          />
                        </div>
                      )}

                      {block.type === "code" && (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={block.content}
                            onChange={(e) =>
                              updateBlock(block.id, { content: e.target.value })
                            }
                            placeholder="Текст на архивен документ или бележка..."
                            className="w-full rounded-xl bg-zinc-900 p-3.5 font-mono text-base text-amber-200 focus:outline-none"
                          />
                        </div>
                      )}

                      {block.type === "collapsible" && (
                        <div className="space-y-2.5 rounded-xl bg-amber-500/5 p-3.5">
                          <input
                            type="text"
                            value={block.collapsibleTitle || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                collapsibleTitle: e.target.value,
                              })
                            }
                            placeholder="Заглавие на сгъваемото каре..."
                            className="w-full rounded-lg border border-amber-500/30 bg-white px-3.5 py-2 text-base font-semibold dark:bg-zinc-900"
                          />
                          <textarea
                            rows={3}
                            value={block.content}
                            onChange={(e) =>
                              updateBlock(block.id, { content: e.target.value })
                            }
                            placeholder="Съдържание, което се показва при разгъване..."
                            className="w-full rounded-lg border border-stone-200 bg-white p-3 font-serif text-base sm:text-lg dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>
                      )}

                      {(block.type === "image" || block.type === "media") && (
                        <div className="space-y-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-950/50">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex-1 min-w-[220px]">
                              <label className="block text-xs sm:text-sm font-bold uppercase text-stone-600 dark:text-zinc-300">
                                Адрес на снимка/файл (от /data или външен линк)
                              </label>
                              <input
                                type="text"
                                value={block.mediaUrl || ""}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    mediaUrl: e.target.value,
                                  })
                                }
                                placeholder="/uploads/fotinov-portrait.svg"
                                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setMediaTargetField("block");
                                setMediaTargetBlockId(block.id);
                                setAllowedMediaTypes(
                                  block.type === "image" ? ["image"] : undefined
                                );
                                setMediaModalOpen(true);
                              }}
                              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500"
                            >
                              <FolderOpen className="h-4 w-4" />
                              <span>Избери от /data библиотека</span>
                            </button>
                          </div>

                          {/* IMAGE SIZING, PAGE LAYOUT, CROPPING & SIDE-TEXT CONTROLS */}
                          {block.type === "image" && (
                            <div className="space-y-4 rounded-xl border border-amber-500/40 bg-white p-4 shadow-sm dark:border-amber-500/30 dark:bg-zinc-900">
                              {/* 1. Позиция и разположение на снимката */}
                              <div>
                                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                                  1. Разположение на снимката (Цяла страница / До текста):
                                </label>
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                  {(
                                    [
                                      {
                                        val: "center",
                                        title: "🎯 Центрирана",
                                        sub: "На собствен ред",
                                      },
                                      {
                                        val: "full-page",
                                        title: "🖼️ На цяла страница",
                                        sub: "Максимален размер",
                                      },
                                      {
                                        val: "float-left",
                                        title: "⬅️ Отляво до текста",
                                        sub: "Абзацът е отдясно",
                                      },
                                      {
                                        val: "float-right",
                                        title: "➡️ Отдясно до текста",
                                        sub: "Абзацът е отляво",
                                      },
                                    ] as const
                                  ).map((opt) => {
                                    const currentLayout =
                                      block.imageLayout ||
                                      (block.imageSize === "full"
                                        ? "full-page"
                                        : "center");
                                    const active = currentLayout === opt.val;
                                    return (
                                      <button
                                        key={opt.val}
                                        type="button"
                                        onClick={() =>
                                          updateBlock(block.id, {
                                            imageLayout: opt.val,
                                            imageSize:
                                              opt.val === "full-page"
                                                ? "full"
                                                : block.imageSize === "full"
                                                ? "medium"
                                                : block.imageSize || "medium",
                                          })
                                        }
                                        className={`rounded-xl border p-2.5 text-left transition ${
                                          active
                                            ? "border-amber-600 bg-amber-600 text-white shadow"
                                            : "border-stone-200 bg-stone-50 text-stone-800 hover:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                        }`}
                                      >
                                        <div className="text-xs sm:text-sm font-bold">
                                          {opt.title}
                                        </div>
                                        <div
                                          className={`text-[11px] ${
                                            active
                                              ? "text-amber-100"
                                              : "text-stone-500 dark:text-zinc-400"
                                          }`}
                                        >
                                          {opt.sub}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 2. Размер на снимката & 3. Изрязване (Формат за поставяне до абзац) */}
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Размер */}
                                <div>
                                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                                    2. Размер на снимката:
                                  </label>
                                  <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                                    {(
                                      [
                                        { val: "small", label: "Малка (~25%)" },
                                        {
                                          val: "medium",
                                          label: "Средна (~40%)",
                                        },
                                        { val: "large", label: "Голяма (~65%)" },
                                        {
                                          val: "full",
                                          label: "Цяла стр. (100%)",
                                        },
                                      ] as const
                                    ).map((sz) => {
                                      const curSize =
                                        block.imageSize ||
                                        (block.imageLayout === "full-page"
                                          ? "full"
                                          : "medium");
                                      const active = curSize === sz.val;
                                      return (
                                        <button
                                          key={sz.val}
                                          type="button"
                                          onClick={() =>
                                            updateBlock(block.id, {
                                              imageSize: sz.val,
                                              imageLayout:
                                                sz.val === "full"
                                                  ? "full-page"
                                                  : block.imageLayout ===
                                                    "full-page"
                                                  ? "center"
                                                  : block.imageLayout,
                                            })
                                          }
                                          className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition ${
                                            active
                                              ? "border-stone-900 bg-stone-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                                              : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                          }`}
                                        >
                                          {sz.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Изрязване (Crop) */}
                                <div>
                                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                                    3. Изрязване (Формат за до абзац):
                                  </label>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {(
                                      [
                                        {
                                          val: "contain",
                                          label: "Без изрязване (Цяла)",
                                        },
                                        {
                                          val: "portrait",
                                          label: "✂️ Портрет 3:4 (До абзац)",
                                        },
                                        {
                                          val: "square",
                                          label: "✂️ Квадрат 1:1 (До абзац)",
                                        },
                                        {
                                          val: "landscape",
                                          label: "✂️ Пейзаж 4:3",
                                        },
                                        {
                                          val: "wide",
                                          label: "✂️ Панорама 16:9",
                                        },
                                      ] as const
                                    ).map((cr) => {
                                      const curCrop =
                                        block.imageCrop || "contain";
                                      const active = curCrop === cr.val;
                                      return (
                                        <button
                                          key={cr.val}
                                          type="button"
                                          onClick={() =>
                                            updateBlock(block.id, {
                                              imageCrop: cr.val,
                                            })
                                          }
                                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                                            active
                                              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                              : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                          }`}
                                        >
                                          {cr.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* 4. Фокус при изрязване (показва се само когато снимката е изрязана) */}
                              {block.imageCrop &&
                                block.imageCrop !== "contain" && (
                                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/50 px-3.5 py-2.5 dark:bg-emerald-950/20">
                                    <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">
                                      Фокус на изрязването (коя част да се вижда):
                                    </span>
                                    {(
                                      [
                                        { val: "center", label: "Център" },
                                        {
                                          val: "top",
                                          label: "Горе (Лице / Глава)",
                                        },
                                        { val: "bottom", label: "Долу" },
                                        { val: "left", label: "Ляво" },
                                        { val: "right", label: "Дясно" },
                                      ] as const
                                    ).map((fc) => {
                                      const curFocus =
                                        block.imageFocus || "center";
                                      return (
                                        <button
                                          key={fc.val}
                                          type="button"
                                          onClick={() =>
                                            updateBlock(block.id, {
                                              imageFocus: fc.val,
                                            })
                                          }
                                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                            curFocus === fc.val
                                              ? "bg-emerald-600 text-white shadow-sm"
                                              : "bg-white text-stone-700 hover:bg-emerald-100 dark:bg-zinc-800 dark:text-zinc-300"
                                          }`}
                                        >
                                          {fc.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                              {/* 5. Поле за текст / абзац непосредствено до снимката (при Отляво / Отдясно до текста) */}
                              {(block.imageLayout === "float-left" ||
                                block.imageLayout === "float-right") && (
                                <div className="space-y-2.5 rounded-xl border-2 border-amber-500/40 bg-amber-50/40 p-3.5 dark:bg-amber-950/20">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                                      {block.imageLayout === "float-left"
                                        ? "⬅️ Снимката е отляво — Текст на абзаца отдясно до нея:"
                                        : "➡️ Снимката е отдясно — Текст на абзаца отляво до нея:"}
                                    </label>

                                    {/* 1-Click button to pull text from an adjacent paragraph block */}
                                    {(chapter.blocks[index + 1]?.type ===
                                      "paragraph" ||
                                      chapter.blocks[index - 1]?.type ===
                                        "paragraph") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const adjIdx =
                                            chapter.blocks[index + 1]?.type ===
                                            "paragraph"
                                              ? index + 1
                                              : index - 1;
                                          const adjPara =
                                            chapter.blocks[adjIdx];
                                          if (!adjPara) return;
                                          const mergedText = [
                                            block.content?.trim(),
                                            adjPara.content?.trim(),
                                          ]
                                            .filter(Boolean)
                                            .join(" ");
                                          setChapter((prev) => ({
                                            ...prev,
                                            blocks: prev.blocks
                                              .map((b) =>
                                                b.id === block.id
                                                  ? {
                                                      ...b,
                                                      content: mergedText,
                                                    }
                                                  : b
                                              )
                                              .filter(
                                                (b) => b.id !== adjPara.id
                                              ),
                                          }));
                                          showToast(
                                            "Съседният абзац беше прикачен директно до снимката!"
                                          );
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-amber-500"
                                      >
                                        <Scissors className="h-3.5 w-3.5" />
                                        <span>
                                          Вземи текста от съседния абзац тук до снимката
                                        </span>
                                      </button>
                                    )}
                                  </div>

                                  <textarea
                                    rows={3}
                                    value={block.content || ""}
                                    onChange={(e) =>
                                      updateBlock(block.id, {
                                        content: e.target.value,
                                      })
                                    }
                                    placeholder="Напишете абзац тук, за да застане директно до снимката (или оставете празно, за да се обтича автоматично със следващия блок „Абзац“)..."
                                    className="w-full rounded-lg border border-amber-500/30 bg-white p-3 font-serif text-base leading-relaxed focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <p className="text-xs text-stone-600 dark:text-zinc-400">
                                    💡 <strong>Съвет:</strong> Дори да оставите това поле празно, снимката автоматично ще застане отстрани до съседния блок „Абзац (Текст)“ на страницата!
                                  </p>
                                </div>
                              )}

                              {/* 6. ЖИВ ПРЕГЛЕД НА СНИМКАТА (LIVE PREVIEW) */}
                              {block.mediaUrl && (
                                <div className="rounded-xl border border-stone-200 bg-[#f6ecd6] p-4 text-[#26170a]">
                                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6e1a12]">
                                    <span>
                                      ❦ Преглед на снимката в страницата:
                                    </span>
                                    <span>
                                      {block.imageLayout === "full-page" ||
                                      block.imageSize === "full"
                                        ? "На цяла страница"
                                        : block.imageLayout === "float-left"
                                        ? "Отляво до абзац"
                                        : block.imageLayout === "float-right"
                                        ? "Отдясно до абзац"
                                        : "Центрирана"}
                                      {" • "}
                                      {block.imageCrop === "portrait"
                                        ? "Изрязана 3:4"
                                        : block.imageCrop === "square"
                                        ? "Изрязана 1:1"
                                        : block.imageCrop === "landscape"
                                        ? "Изрязана 4:3"
                                        : block.imageCrop === "wide"
                                        ? "Изрязана 16:9"
                                        : "Без изрязване"}
                                    </span>
                                  </div>

                                  <div
                                    className={`flex flex-col items-center gap-4 ${
                                      block.imageLayout === "float-left"
                                        ? "sm:flex-row sm:items-start"
                                        : block.imageLayout === "float-right"
                                        ? "sm:flex-row-reverse sm:items-start"
                                        : "justify-center"
                                    }`}
                                  >
                                    <div
                                      className={`overflow-hidden rounded border-2 border-[#6b4423] bg-[#ead8b4] p-1.5 shadow ${
                                        block.imageLayout === "full-page" ||
                                        block.imageSize === "full"
                                          ? "w-full"
                                          : block.imageSize === "small"
                                          ? "w-32 sm:w-40 shrink-0"
                                          : block.imageSize === "large"
                                          ? "w-56 sm:w-72 shrink-0"
                                          : "w-44 sm:w-56 shrink-0"
                                      }`}
                                    >
                                      <img
                                        src={block.mediaUrl}
                                        alt={block.caption || "Преглед"}
                                        className={`w-full border border-[#7a5230]/50 ${
                                          block.imageCrop === "portrait"
                                            ? "aspect-[3/4] object-cover"
                                            : block.imageCrop === "square"
                                            ? "aspect-square object-cover"
                                            : block.imageCrop === "landscape"
                                            ? "aspect-[4/3] object-cover"
                                            : block.imageCrop === "wide"
                                            ? "aspect-video object-cover"
                                            : "max-h-64 object-contain"
                                        } ${
                                          block.imageFocus === "top"
                                            ? "object-top"
                                            : block.imageFocus === "bottom"
                                            ? "object-bottom"
                                            : block.imageFocus === "left"
                                            ? "object-left"
                                            : block.imageFocus === "right"
                                            ? "object-right"
                                            : "object-center"
                                        }`}
                                      />
                                      {block.caption && (
                                        <p className="mt-1 text-center font-serif text-xs italic text-[#4e3016]">
                                          ❦ {block.caption}
                                        </p>
                                      )}
                                    </div>

                                    {(block.imageLayout === "float-left" ||
                                      block.imageLayout === "float-right") && (
                                      <div className="flex-1 font-serif text-sm leading-relaxed text-[#26170a]">
                                        {block.content?.trim() ? (
                                          <div
                                            dangerouslySetInnerHTML={{
                                              __html: block.content,
                                            }}
                                          />
                                        ) : (
                                          <p className="italic opacity-75">
                                            Тук отстрани до снимката автоматично се разполага текстът от съседния абзац на страницата...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <input
                            type="text"
                            value={block.caption || ""}
                            onChange={(e) =>
                              updateBlock(block.id, { caption: e.target.value })
                            }
                            placeholder="Надпис под снимката (по желание)..."
                            className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                      )}

                      {/* SIMPLIFIED & STREAMLINED PAGE LINK / CHOICE BLOCK */}
                      {block.type === "choice" && (
                        <div className="space-y-4 rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                              <Compass className="h-4 w-4" />
                              Връзки към други страници (Бутони за преход)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const defaultTarget =
                                  chapters.find(
                                    (c) => c.slug !== chapter.slug
                                  ) || chapters[0];
                                const nextChoice: ChoiceOption = {
                                  id: `c-${Date.now()}`,
                                  label: defaultTarget
                                    ? `Към: ${
                                        defaultTarget.title ||
                                        defaultTarget.slug
                                      }`
                                    : "Към следваща страница",
                                  description: "",
                                  targetSlug:
                                    defaultTarget?.slug || "prologue",
                                };
                                updateBlock(block.id, {
                                  choices: [
                                    ...(block.choices || []),
                                    nextChoice,
                                  ],
                                });
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-amber-500"
                            >
                              <Plus className="h-4 w-4" /> Добави бутон за връзка
                            </button>
                          </div>

                          {/* 1-Click Quick Add Pills right inside the Choice Block */}
                          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-100/60 p-3 dark:bg-zinc-900">
                            <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                              Бързо добави връзка към:
                            </span>
                            {chapters.map((chItem, cIdx) => (
                              <button
                                key={chItem.id}
                                type="button"
                                onClick={() => {
                                  const nextChoice: ChoiceOption = {
                                    id: `c-${Date.now()}-${cIdx}`,
                                    label: `Към: ${
                                      chItem.title || `Слайд ${cIdx + 1}`
                                    }`,
                                    description: chItem.subtitle || "",
                                    targetSlug: chItem.slug,
                                  };
                                  updateBlock(block.id, {
                                    choices: [
                                      ...(block.choices || []),
                                      nextChoice,
                                    ],
                                  });
                                }}
                                className="rounded-lg border border-amber-600/30 bg-white px-2.5 py-1 text-xs sm:text-sm font-semibold text-stone-800 hover:bg-amber-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200"
                              >
                                + Слайд {cIdx + 1}: {chItem.title || chItem.slug}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={block.choicePrompt || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                choicePrompt: e.target.value,
                              })
                            }
                            placeholder="Заглавие над бутоните (напр. Преминете към следващия слайд)..."
                            className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-serif text-base font-bold dark:border-zinc-700 dark:bg-zinc-900"
                          />

                          <div className="space-y-3">
                            {(block.choices || []).map((chOpt, cIdx) => {
                              const showAdv = Boolean(
                                showAdvancedChoiceIds[chOpt.id]
                              );
                              return (
                                <div
                                  key={chOpt.id}
                                  className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12 items-center">
                                    {/* Step 1: Pick Target Page (Auto-updates label!) */}
                                    <div className="sm:col-span-5">
                                      <label className="block text-xs sm:text-sm font-bold uppercase text-amber-700 dark:text-amber-400">
                                        1. Води към страница:
                                      </label>
                                      <select
                                        value={chOpt.targetSlug}
                                        onChange={(e) => {
                                          const newTargetSlug = e.target.value;
                                          const foundCh = chapters.find(
                                            (c) => c.slug === newTargetSlug
                                          );
                                          const updated = [
                                            ...(block.choices || []),
                                          ];
                                          const shouldAutoUpdateLabel =
                                            !chOpt.label ||
                                            chOpt.label.startsWith("Към:") ||
                                            chOpt.label ===
                                              "New Branching Option";

                                          updated[cIdx] = {
                                            ...chOpt,
                                            targetSlug: newTargetSlug,
                                            label:
                                              shouldAutoUpdateLabel && foundCh
                                                ? `Към: ${
                                                    foundCh.title ||
                                                    foundCh.slug
                                                  }`
                                                : chOpt.label,
                                          };
                                          updateBlock(block.id, {
                                            choices: updated,
                                          });
                                        }}
                                        className="mt-1.5 w-full rounded-lg border border-amber-500/50 bg-amber-50/40 px-3 py-2 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
                                      >
                                        {chapters.map((c, idx) => (
                                          <option key={c.id} value={c.slug}>
                                            Слайд {idx + 1}:{" "}
                                            {c.title || `Празна (${c.slug})`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Step 2: Button Label */}
                                    <div className="sm:col-span-6">
                                      <label className="block text-xs sm:text-sm font-bold uppercase text-stone-500 dark:text-zinc-400">
                                        2. Текст върху бутона:
                                      </label>
                                      <input
                                        type="text"
                                        value={chOpt.label}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(block.choices || []),
                                          ];
                                          updated[cIdx] = {
                                            ...chOpt,
                                            label: e.target.value,
                                          };
                                          updateBlock(block.id, {
                                            choices: updated,
                                          });
                                        }}
                                        placeholder="Текст на бутона..."
                                        className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
                                      />
                                    </div>

                                    {/* Delete Option Button */}
                                    <div className="flex justify-end sm:col-span-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = (
                                            block.choices || []
                                          ).filter((_, i) => i !== cIdx);
                                          updateBlock(block.id, {
                                            choices: updated,
                                          });
                                        }}
                                        className="mt-5 rounded-lg p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                        title="Премахни този бутон"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Optional Subtitle & Advanced State Toggle */}
                                  <div className="mt-2.5 flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowAdvancedChoiceIds((p) => ({
                                          ...p,
                                          [chOpt.id]: !showAdv,
                                        }))
                                      }
                                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-zinc-400"
                                    >
                                      {showAdv ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      )}
                                      <span>
                                        Допълнително описание / условия (по желание)
                                      </span>
                                    </button>
                                  </div>

                                  {showAdv && (
                                    <div className="mt-2.5 grid grid-cols-1 gap-2.5 border-t border-stone-100 pt-2.5 sm:grid-cols-3 dark:border-zinc-800">
                                      <input
                                        type="text"
                                        value={chOpt.description || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(block.choices || []),
                                          ];
                                          updated[cIdx] = {
                                            ...chOpt,
                                            description: e.target.value,
                                          };
                                          updateBlock(block.id, {
                                            choices: updated,
                                          });
                                        }}
                                        placeholder="Подтекст / описание..."
                                        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Задава ключ (напр. key_1)"
                                        value={chOpt.setStateKey || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(block.choices || []),
                                          ];
                                          updated[cIdx] = {
                                            ...chOpt,
                                            setStateKey: e.target.value,
                                          };
                                          updateBlock(block.id, {
                                            choices: updated,
                                          });
                                        }}
                                        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Изисква ключ"
                                        value={chOpt.requiredStateKey || ""}
                                        onChange={(e) => {
                                          const updated = [
                                            ...(block.choices || []),
                                          ];
                                          updated[cIdx] = {
                                            ...chOpt,
                                            requiredStateKey: e.target.value,
                                          };
                                          updateBlock(block.id, {
                                            choices: updated,
                                          });
                                        }}
                                        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Inline + Insert Block Divider below each block */}
                      <div className="mt-4 flex items-center justify-center opacity-85 transition group-hover:opacity-100">
                        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                          <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">
                            + Добави отдолу:
                          </span>
                          {(
                            [
                              { t: "paragraph", l: "Текст" },
                              { t: "heading", l: "Заглавие" },
                              { t: "image", l: "Снимка" },
                              { t: "choice", l: "Връзка" },
                              { t: "collapsible", l: "Бележка" },
                            ] as { t: BlockType; l: string }[]
                          ).map((item) => (
                            <button
                              key={item.t}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addBlock(item.t, index);
                              }}
                              className="rounded-md px-2.5 py-0.5 text-xs font-semibold text-stone-700 hover:bg-amber-600 hover:text-white dark:text-zinc-200"
                            >
                              {item.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Footnotes Manager Section */}
            <div className="mt-10 border-t border-stone-200 pt-6 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300">
                    Бележки под линия ({chapter.footnotes?.length || 0})
                  </h3>
                  <p className="mt-0.5 text-sm text-stone-500 dark:text-zinc-400">
                    Поставете <code>[1]</code>, <code>[2]</code> в текста, за да се покаже интерактивна бележка.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = (chapter.footnotes?.length || 0) + 1;
                    setChapter((p) => ({
                      ...p,
                      footnotes: [
                        ...(p.footnotes || []),
                        {
                          id: `fn-${Date.now()}`,
                          number: nextNum,
                          label: String(nextNum),
                          content: "Нова архивна бележка...",
                        },
                      ],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-1.5 text-sm font-semibold hover:bg-stone-100 dark:border-zinc-700"
                >
                  <Plus className="h-4 w-4" /> Добави бележка
                </button>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {(chapter.footnotes || []).map((fn, fIdx) => (
                  <div
                    key={fn.id}
                    className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <span className="rounded bg-amber-500/20 px-2.5 py-1 font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
                      [{fn.number}]
                    </span>
                    <input
                      type="text"
                      value={fn.content}
                      onChange={(e) => {
                        const updated = [...(chapter.footnotes || [])];
                        updated[fIdx] = { ...fn, content: e.target.value };
                        setChapter((p) => ({ ...p, footnotes: updated }));
                      }}
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setChapter((p) => ({
                          ...p,
                          footnotes: p.footnotes.filter((_, i) => i !== fIdx),
                        }))
                      }
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Bottom Action Bar: Save Draft, Publish, Preview (Mobile-responsive) */}
      <div className="fixed inset-x-2 bottom-3 z-40 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-300/80 bg-stone-900/95 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-md dark:border-zinc-700 sm:inset-x-0 sm:bottom-5 sm:px-6 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${
              chapter.status === "published" ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <div className="truncate text-xs sm:text-sm">
            <span className="font-semibold">
              {chapter.title || `Празна страница (/${chapter.slug})`}
            </span>
            <span className="ml-1.5 text-stone-400">
              ({chapter.blocks.length} блока)
            </span>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
          <button
            type="button"
            disabled={savingStatus === "saving"}
            onClick={() => handleSaveChapter("draft")}
            className="flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-200 transition hover:bg-stone-700 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {savingStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Чернова</span>
          </button>

          <button
            type="button"
            disabled={savingStatus === "saving"}
            onClick={() => handleSaveChapter("published")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-amber-500 sm:flex-initial sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <Send className="h-4 w-4" />
            <span>Публикувай (Запази)</span>
          </button>

          <Link
            href={`/${chapter.slug}`}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-stone-900 transition hover:bg-stone-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>Преглед</span>
          </Link>
        </div>
      </div>

      {/* Media Picker Modal (/data Integration) */}
      <MediaPickerModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        allowedTypes={allowedMediaTypes}
        onSelect={(item: MediaItem) => {
          if (mediaTargetField === "narrator") {
            setChapter((p) => ({ ...p, narratorAudioUrl: item.url }));
            showToast(`Свързан аудио файл: ${item.name}`);
          } else if (mediaTargetBlockId) {
            updateBlock(mediaTargetBlockId, {
              mediaUrl: item.url,
              mediaType: item.type === "other" ? "image" : item.type,
              caption: item.name,
            });
            showToast(`Вмъкнат файл "${item.name}" от /data`);
          }
        }}
      />

      {/* Visual Inline Page Link Modal (Вмъкване на връзка в текст) */}
      {linkModalBlockId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmInlineLink}
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold">
                Вмъкни връзка към страница
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalBlockId(null)}
                className="rounded p-1.5 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1.5 text-sm text-stone-600 dark:text-zinc-400">
              Изберете страница от списъка, към която да води връзката в текста:
            </p>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-sm font-semibold">
                  1. Изберете страница:
                </label>
                <select
                  value={inlineLinkTargetSlug}
                  onChange={(e) => {
                    const slugVal = e.target.value;
                    setInlineLinkTargetSlug(slugVal);
                    const found = chapters.find((c) => c.slug === slugVal);
                    if (found) {
                      setInlineLinkText(found.title || found.slug);
                    }
                  }}
                  className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {chapters.map((c, idx) => (
                    <option key={c.id} value={c.slug}>
                      Слайд {idx + 1}: {c.title || `Празна (${c.slug})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold">
                  2. Текст на връзката:
                </label>
                <input
                  type="text"
                  value={inlineLinkText}
                  onChange={(e) => setInlineLinkText(e.target.value)}
                  placeholder="Към следващата страница..."
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLinkModalBlockId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                Отказ
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
              >
                Вмъкни връзката
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Chapter / Page Creation Modal (Blank by default!) */}
      {newChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateNewChapter}
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="font-serif text-xl font-bold">
              Създаване на нова страница / слайд
            </h3>
            <p className="mt-1.5 text-sm text-stone-600 dark:text-zinc-400">
              Можете да оставите заглавието празно и да започнете с напълно чист лист.
            </p>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-sm font-semibold">
                  Заглавие на страницата (не е задължително)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Оставете празно за страница без заглавие..."
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm sm:text-base dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">
                  URL Адрес / Slug (генерира се автоматично, ако е празно)
                </label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="nov-slayd"
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3.5 py-2.5 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm font-semibold text-stone-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={startCompletelyBlank}
                  onChange={(e) => setStartCompletelyBlank(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600"
                />
                <span>
                  Създай като напълно празна страница (без начални блокове)
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setNewChapterModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                Отказ
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
              >
                Създай страницата
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
