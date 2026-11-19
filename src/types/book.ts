export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "media"
  | "choice"
  | "collapsible"
  | "quote"
  | "code"
  | "footnote";

export type TextAlignment = "left" | "center" | "right";

export type ImageLayout = "center" | "full-page" | "float-left" | "float-right";
export type ImageSize = "small" | "medium" | "large" | "full";
export type ImageCrop =
  | "contain"
  | "portrait"
  | "square"
  | "landscape"
  | "wide";
export type ImageFocus = "center" | "top" | "bottom" | "left" | "right";

export interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
  targetSlug: string; // Target chapter slug to navigate to
  setStateKey?: string; // Optional state variable set when clicked (e.g. "has_astrolabe")
  requiredStateKey?: string; // Optional state key required to select this choice
  consequenceText?: string; // Optional inline feedback before/upon jumping
}

export interface BookBlock {
  id: string;
  type: BlockType;
  content: string; // HTML/rich text or main text content
  align?: TextAlignment;
  pageSide?: "left" | "right"; // Optional explicit placement in Textbook Mode (Лява / Дясна страница)
  // Heading specific
  level?: 1 | 2 | 3;
  // Image / Media specific
  mediaUrl?: string;
  mediaType?: "image" | "audio" | "video" | "pdf" | "json";
  caption?: string;
  alt?: string;
  imageLayout?: ImageLayout; // "center" | "full-page" | "float-left" | "float-right"
  imageSize?: ImageSize; // "small" | "medium" | "large" | "full"
  imageCrop?: ImageCrop; // "contain" | "portrait" | "square" | "landscape" | "wide"
  imageFocus?: ImageFocus; // "center" | "top" | "bottom" | "left" | "right"
  // Choice / Decision block specific
  choicePrompt?: string;
  choices?: ChoiceOption[];
  // Collapsible block specific
  collapsibleTitle?: string;
  defaultOpen?: boolean;
  // Quote specific
  quoteAuthor?: string;
  // Code specific
  codeLanguage?: string;
  // Footnote specific
  footnoteNumber?: number;
  footnoteLabel?: string;
}

export interface FootnoteItem {
  id: string;
  number: number;
  label: string;
  content: string;
}

export interface Chapter {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  order: number;
  status: "draft" | "published";
  readingTimeMinutes?: number;
  narratorAudioUrl?: string;
  narratorTranscript?: string;
  unlockCondition?: string; // e.g., "has_astrolabe"
  blocks: BookBlock[];
  footnotes: FootnoteItem[];
  updatedAt: string;
  createdAt: string;
}

export type MediaCategory =
  | "image"
  | "audio"
  | "video"
  | "pdf"
  | "json"
  | "other";

export interface MediaItem {
  id: string;
  name: string;
  filename: string;
  url: string;
  type: MediaCategory;
  mimeType: string;
  size: number;
  category: string;
  tags: string[];
  uploadedAt: string;
}

export interface DatabaseSchema {
  bookTitle: string;
  bookAuthor: string;
  bookDescription: string;
  chapters: Chapter[];
  media: MediaItem[];
}

