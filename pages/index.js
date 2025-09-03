import Editor from '@/components/Editor'
import { EditorProvider } from '@/context/EditorContext'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </main>
  )
}
