import React from 'react'

interface MarkdownMessageProps {
  content: string
  className?: string
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  // Parse markdown to HTML
  const parseMarkdown = (text: string): string => {
    let html = text
    
    // Code blocks (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-black/10 dark:bg-white/10 rounded p-2 my-2 overflow-x-auto"><code>$1</code></pre>')
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono">$1</code>')
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
    html = html.replace(/__([^_]+)__/g, '<strong class="font-bold">$1</strong>')
    
    // Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Unordered lists (- item or * item)
    html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li class="ml-4">$1</li>')
    html = html.replace(/(<li class="ml-4">.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-2">$&</ul>')
    
    // Ordered lists (1. item)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>')
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-3 mb-1">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>')
    
    // Line breaks
    html = html.replace(/\n\n/g, '<br/><br/>')
    html = html.replace(/\n/g, '<br/>')
    
    return html
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  )
}
