import { Editor } from '@tinymce/tinymce-react'

interface TinyMCEEditorProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export default function TinyEditor({
  value,
  onChange,
  isResize = false,
  toolbar = 'undo redo | bold italic underline | bullist numlist | alignleft aligncenter alignright alignjustify',
  h = 400,
  lineHeight = 1.5
}: TinyMCEEditorProps & { isResize?: boolean; toolbar?: string; h?: number; lineHeight?: number }) {
  return (
    <Editor
      apiKey='bkz4hadgd1122xtshfn8t62a4frelcalb63w1ajzt1ssgs1o'
      value={value}
      onEditorChange={(newValue) => onChange(newValue)}
      init={{
        height: h,
        menubar: false,
        plugins: ['lists'],
        toolbar,
        toolbar_mode: 'sliding',
        line_height: 1,
        content_style: `body { font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height: ${lineHeight} }`,
        resize: isResize
      }}
    />
  )
}
