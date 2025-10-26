import MarkdownText from "./MarkdownText";

interface TypewriterTextProps {
  text: string;
}

export default function TypewriterText({ text }: TypewriterTextProps) {
  // Simply display the text as it streams in
  return <MarkdownText text={text} />;
}
