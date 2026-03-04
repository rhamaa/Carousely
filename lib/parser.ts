import type { CTAStyle, ParseResult, SlideBlock, AspectRatio, Slide } from "./types";
import { themeStyles } from "./constants";

const imageRegex = /^!\[(.*?)]\((.*?)\)\s*(\{.*})?\s*$/;
const orderedRegex = /^\d+\.\s+/;
const directiveRegex = /^:::(\w+)(.*)$/;
const attributeRegex = /([a-zA-Z0-9_-]+)=(["']?)([^"'\\s}]+)\\2/g;

export const parseAttributes = (source: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  if (!source) {
    return attributes;
  }

  attributeRegex.lastIndex = 0;
  let match: RegExpExecArray | null = null;
  while ((match = attributeRegex.exec(source)) !== null) {
    attributes[match[1]] = match[3];
  }

  return attributes;
};

export const coerceCTAStyle = (raw?: string): CTAStyle => {
  if (raw && raw.toLowerCase() === "secondary") {
    return "secondary";
  }
  return "primary";
};

export const parseFrontmatter = (source: string): { metadata: Record<string, string>; body: string } => {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return { metadata: {}, body: source };
  }

  const metadata: Record<string, string> = {};
  const lines = frontmatterMatch[1].split("\n");

  for (const line of lines) {
    const [rawKey, ...valueParts] = line.split(":");
    if (!rawKey || valueParts.length === 0) {
      continue;
    }

    const key = rawKey.trim();
    const value = valueParts.join(":").trim().replace(/^"|"$/g, "");
    if (key) {
      metadata[key] = value;
    }
  }

  return {
    metadata,
    body: source.slice(frontmatterMatch[0].length),
  };
};

export const buildBlocks = (lines: string[]): { blocks: SlideBlock[]; errors: string[] } => {
  const blocks: SlideBlock[] = [];
  const errors: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    const directiveMatch = line.match(directiveRegex);
    if (directiveMatch) {
      const [, directiveName, rawAttributes] = directiveMatch;
      const directive = directiveName.toLowerCase();
      const attrs = parseAttributes(rawAttributes?.trim() ?? "");
      index += 1;
      const directiveLines: string[] = [];

      while (index < lines.length && lines[index].trim() !== ":::") {
        directiveLines.push(lines[index]);
        index += 1;
      }

      if (index >= lines.length) {
        errors.push(`Directive :::${directive} belum ditutup dengan :::`);
      } else {
        const directiveBody = directiveLines.join("\n").trim();

        switch (directive) {
          case "quote": {
            if (directiveBody) {
              blocks.push({ kind: "quote", text: directiveBody });
            } else {
              errors.push("Blok quote kosong dilewati.");
            }
            break;
          }
          case "cta": {
            blocks.push({
              kind: "cta",
              text: directiveBody || attrs.text || "Tambahkan CTA di sini",
              style: coerceCTAStyle(attrs.style),
              href: attrs.href,
            });
            break;
          }
          case "agenda": {
            const agendaItems = directiveLines
              .map((agendaLine) => agendaLine.trim())
              .filter(Boolean)
              .map((agendaLine) => agendaLine.replace(/^[-*]\\s*/, "").trim())
              .filter(Boolean);

            if (agendaItems.length === 0) {
              errors.push("Blok agenda membutuhkan minimal satu poin.");
            }

            blocks.push({
              kind: "agenda",
              title: attrs.title,
              items: agendaItems,
              columns: attrs.columns ? Number.parseInt(attrs.columns, 10) || undefined : undefined,
            });
            break;
          }
          default: {
            errors.push(`Directive :::${directive} tidak dikenali.`);
            break;
          }
        }
      }

      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }

      blocks.push({ kind: "bullet-list", items });
      continue;
    }

    if (orderedRegex.test(line)) {
      const items: string[] = [];

      while (index < lines.length && orderedRegex.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(orderedRegex, "").trim());
        index += 1;
      }

      blocks.push({ kind: "ordered-list", items });
      continue;
    }

    const imageMatch = line.match(imageRegex);
    if (imageMatch) {
      const attributes = imageMatch[3]
        ? parseAttributes(imageMatch[3].slice(1, -1))
        : {};
      blocks.push({
        kind: "image",
        alt: imageMatch[1] || "image",
        src: imageMatch[2],
        ratio: attributes.ratio,
        align: attributes.align,
      });
      index += 1;
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (
        !candidate ||
        candidate === ":::quote" ||
        candidate.startsWith("- ") ||
        orderedRegex.test(candidate) ||
        imageRegex.test(candidate)
      ) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraphLines.join(" ") });
      continue;
    }

    index += 1;
  }

  return { blocks, errors };
};

export const parseMarkdownToSlides = (source: string): ParseResult => {
  const normalized = source.replace(/\r\n/g, "\n");
  const { metadata, body } = parseFrontmatter(normalized);
  const rawSlides = body.split(/^##\s+/m).slice(1);
  const warnings: string[] = [];

  const validAspectRatios = ["4:5", "1:1"];
  let resolvedAspectRatio: AspectRatio = "4:5";
  if (metadata.aspectRatio && validAspectRatios.includes(metadata.aspectRatio)) {
    resolvedAspectRatio = metadata.aspectRatio as AspectRatio;
  } else if (metadata.aspectRatio) {
    warnings.push(`aspectRatio '${metadata.aspectRatio}' tidak valid. Menggunakan default '4:5'.`);
  }

  let resolvedTheme: keyof typeof themeStyles = "aurora";
  if (metadata.brand) {
    const brand = metadata.brand.toLowerCase();
    if (brand in themeStyles) {
      resolvedTheme = brand as keyof typeof themeStyles;
    } else {
      warnings.push(`Brand '${metadata.brand}' tidak dikenali. Menggunakan tema default.`);
    }
  }

  const slides: Slide[] = rawSlides.map((rawSlide, i) => {
    const lines = rawSlide.split("\n");
    const title = lines[0].trim();
    const contentLines = lines.slice(1);
    const { blocks, errors } = buildBlocks(contentLines);

    return {
      id: `slide-${i + 1}`,
      title,
      blocks,
      errors,
    };
  });

  if (slides.length === 0) {
    warnings.push("Tidak ada slide yang ditemukan. Pastikan setiap slide diawali dengan '## Judul Slide'.");
  }

  return {
    metadata,
    slides,
    warnings,
    resolved: {
      aspectRatio: resolvedAspectRatio,
      theme: resolvedTheme,
    },
  };
};
