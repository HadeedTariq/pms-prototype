import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

type RichTextEditorPreviewProps = {
  content: string;
};

const RichTextEditorPreview = ({ content }: RichTextEditorPreviewProps) => {
  return (
    <div
      data-color-mode="light"
      className="prose max-w-none bg-white text-black p-6 rounded-md shadow-sm overflow-x-auto"
    >
      <MDEditor.Markdown
        source={content}
        style={{
          height: "400px",
          whiteSpace: "pre-wrap",
        }}
      />
    </div>
  );
};

export default RichTextEditorPreview;
