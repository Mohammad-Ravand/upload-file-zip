import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { lowlight } from 'lowlight'
// Import highlight.js CSS theme (choose one)
import 'highlight.js/styles/atom-one-dark.css'
// highlight.js languages
import javascript from 'highlight.js/lib/languages/javascript'
import php from 'highlight.js/lib/languages/php'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'

lowlight.registerLanguage('javascript', javascript)
lowlight.registerLanguage('php', php)
lowlight.registerLanguage('bash', bash)
lowlight.registerLanguage('json', json)
lowlight.registerLanguage('python', python)
lowlight.registerLanguage('html', html)
lowlight.registerLanguage('css', css)
lowlight.registerLanguage('sql', sql)
lowlight.registerLanguage('typescript', typescript)

const editorElement = document.querySelector('#editor')
const inputElement = document.querySelector('#editor_json')
const titleInput = document.querySelector('#editor_title')

// Load initial content if provided by server
let initialContent = null
try {
  const raw = window.__INITIAL_EDITOR_JSON__
  if (raw) {
    let parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    initialContent = parsed
  }
} catch (e) {
  console.error('Failed to parse initial JSON:', e)
}

// Initialize TipTap editor
window.editor = new Editor({
  element: editorElement,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      hardBreak: { keepMarks: true }
    }),
    Image.configure({ inline: true }),
    Link.configure({ openOnClick: true }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({
      placeholder: 'Start writing... Press / for shortcuts, Shift+Enter for line breaks'
    })
  ],
  content: initialContent || '<p>Start typing...</p>',
  onUpdate: () => {
    // Auto-update hidden input every change
    if (inputElement) {
      try {
        inputElement.value = JSON.stringify(window.editor.getJSON())
      } catch (e) {
        console.error('Failed to serialize editor JSON', e)
      }
    }
  }
})

// Ensure hidden input exists
if (!inputElement) {
  const inp = document.createElement('input')
  inp.type = 'hidden'
  inp.id = 'editor_json'
  inp.name = 'content_json'
  inp.value = '{}'
  const form = document.querySelector('#editor_form')
  if (form) form.appendChild(inp)
}

// Form submission: always ensure JSON is set
const form = document.querySelector('#editor_form')
if (form) {
  form.addEventListener('submit', (e) => {
    try {
      const jsonInput = document.querySelector('#editor_json')
      if (jsonInput) {
        jsonInput.value = JSON.stringify(window.editor.getJSON())
      }
    } catch (err) {
      console.error('Submit error:', err)
    }
  })
}

// Image upload handler
const uploadBtn = document.getElementById('upload_btn')
if (uploadBtn) {
  uploadBtn.addEventListener('click', (e) => {
    e.preventDefault()
    document.getElementById('image_input')?.click()
  })
}

const imageInput = document.getElementById('image_input')
if (imageInput) {
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const res = await fetch('/editor/upload-image', {
        method: 'POST',
        headers: token ? { 'X-CSRF-TOKEN': token } : {},
        body: formData
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.url) {
        window.editor.chain().focus().setImage({ src: data.url }).run()
      }
    } catch (err) {
      console.error('Image upload failed:', err)
      alert('Image upload failed: ' + err.message)
    }

    // Reset input
    e.target.value = ''
  })
}

// Dark mode toggle
const darkToggle = document.getElementById('dark_toggle')
if (darkToggle) {
  // Check localStorage for saved preference
  const isDarkMode = localStorage.getItem('editor-dark-mode') === 'true'
  if (isDarkMode) {
    darkToggle.checked = true
    document.body.classList.add('dark-mode')
  }

  darkToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark-mode')
      localStorage.setItem('editor-dark-mode', 'true')
    } else {
      document.body.classList.remove('dark-mode')
      localStorage.setItem('editor-dark-mode', 'false')
    }
  })
}

// Expose editor globally for toolbar buttons
window.editorInstance = window.editor

// Toolbar button handlers
const toolbarButtons = {
  'btn_bold': () => window.editor?.chain().focus().toggleBold().run(),
  'btn_italic': () => window.editor?.chain().focus().toggleItalic().run(),
  'btn_underline': () => window.editor?.chain().focus().toggleUnderline().run(),
  'btn_bullet_list': () => window.editor?.chain().focus().toggleBulletList().run(),
  'btn_ordered_list': () => window.editor?.chain().focus().toggleOrderedList().run(),
  'btn_code_block': () => window.editor?.chain().focus().toggleCodeBlock().run(),
  'btn_blockquote': () => window.editor?.chain().focus().toggleBlockquote().run(),
  'btn_heading': () => window.editor?.chain().focus().toggleHeading({ level: 1 }).run()
}

Object.entries(toolbarButtons).forEach(([id, command]) => {
  const btn = document.getElementById(id)
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      command()
      window.editor?.view.focus()
    })
  }
})

// Show available commands in console for debugging
console.log('Editor ready. Commands: editor.chain().focus().toggleBold().run(), etc.')
