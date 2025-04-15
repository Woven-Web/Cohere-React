
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts markdown to plain text by stripping all markdown syntax
 * @param markdown Markdown string
 * @returns Plain text without markdown syntax
 */
export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove emphasis
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // Remove images
    .replace(/!\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
