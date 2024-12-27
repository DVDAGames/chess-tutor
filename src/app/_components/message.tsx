import ReactMarkdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";

export interface MessageBubbleProps {
  content: string;
}

export default function MessageBubble({ content }: MessageBubbleProps) {
  return (
    <div className="coach-message rounded-sm p-5 border-stone-400 border-2">
      <ReactMarkdown rehypePlugins={[[rehypeExternalLinks, { target: "_blank", rel: ["nofollow", "noopener", "noreferrer"] }]]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
