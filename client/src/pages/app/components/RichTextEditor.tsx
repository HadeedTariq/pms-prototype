import MDEditor from "@uiw/react-md-editor";

type RichTextEditorProps = {
  content: string;
  onChange: (text: string) => void;
};

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  return (
    <div className="w-full" data-color-mode="light">
      <MDEditor
        value={content}
        onChange={(val) => onChange(val || "")}
        className="rounded-md border border-gray-300"
        preview="edit"
        height={400}
      />
    </div>
  );
};

export default RichTextEditor;
