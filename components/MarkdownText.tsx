import React from "react";

interface MarkdownTextProps {
  text: string;
}

export default function MarkdownText({ text }: MarkdownTextProps) {
  const parseBoldText = (line: string) => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before bold
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>{line.substring(lastIndex, match.index)}</span>
        );
      }
      // Add bold text
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(<span key={key++}>{line.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : line;
  };

  const parseMarkdown = (content: string) => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // Handle \n literals and split by lines
    const convertedText = content.replace(/\\n/g, '\n');
    const lines = convertedText.split('\n');

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Empty line - add spacing
      if (trimmedLine === '') {
        parts.push(<div key={key++} className="h-2" />);
        return;
      }

      // Check for link
      const linkMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
        return;
      }

      // Check for main title (#)
      if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('##')) {
        const titleText = trimmedLine.slice(1).trim();
        parts.push(
          <h1 key={key++} className="text-2xl font-bold mt-6 mb-3 first:mt-0">
            {parseBoldText(titleText)}
          </h1>
        );
        return;
      }

      // Check for subtitle (##)
      if (trimmedLine.startsWith('##')) {
        const titleText = trimmedLine.slice(2).trim();
        parts.push(
          <h2 key={key++} className="text-xl font-bold mt-4 mb-2 first:mt-0">
            {parseBoldText(titleText)}
          </h2>
        );
        return;
      }

      // Check for numbered list (e.g., "1.", "2.", "10.")
      const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
      if (numberedListMatch) {
        const number = numberedListMatch[1];
        const listText = numberedListMatch[2];
        parts.push(
          <div key={key++} className="flex gap-2 ml-4">
            <span className="flex-shrink-0">{number}.</span>
            <span>{parseBoldText(listText)}</span>
          </div>
        );
        return;
      }

      // Check for bullet point (-)
      if (trimmedLine.startsWith('-')) {
        const bulletText = trimmedLine.slice(1).trim();
        parts.push(
          <div key={key++} className="flex gap-2 ml-4">
            <span className="flex-shrink-0">•</span>
            <span>{parseBoldText(bulletText)}</span>
          </div>
        );
        return;
      }

      // Regular text with bold parsing
      parts.push(
        <div key={key++}>
          {parseBoldText(trimmedLine)}
        </div>
      );
    });

    return parts;
  };

  return <div>{parseMarkdown(text)}</div>;
}
