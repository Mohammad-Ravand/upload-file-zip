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
        // Mark as modified for auto-save
        window.editorModified = true
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

// Extract document ID from URL for auto-save and WebSocket
let urlPath = window.location.pathname
let docIdMatch = urlPath.match(/\/editor\/(\d+)/)
let docId = docIdMatch ? docIdMatch[1] : null

// Auto-save function - saves without page reload
let lastSavedContent = JSON.stringify(window.editor.getJSON())
let isSaving = false

const autoSave = async () => {
  if (!docId || isSaving || !window.editorModified) return

  const currentContent = JSON.stringify(window.editor.getJSON())

  // Only save if content changed
  if (currentContent === lastSavedContent) {
    window.editorModified = false
    return
  }

  isSaving = true
  showSavingStatus()

  try {
    const title = document.querySelector('#editor_title')?.value || 'Untitled'
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')

    const response = await fetch(`/editor/${docId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': token,
      },
      body: JSON.stringify({
        title: title,
        content_json: currentContent
      })
    })

    if (response.ok) {
      lastSavedContent = currentContent
      window.editorModified = false
      console.log('💾 Auto-saved at', new Date().toLocaleTimeString())
      showSavedStatus()
    } else {
      console.error('Auto-save failed:', response.status)
    }
  } catch (err) {
    console.error('Auto-save error:', err)
  } finally {
    isSaving = false
  }
}

// Show saving status
function showSavingStatus() {
  const status = document.getElementById('auto-save-status')
  if (status) {
    status.className = 'auto-save-status saving'
    document.getElementById('save-text').textContent = 'Saving...'
  }
}

// Show saved status
function showSavedStatus() {
  const status = document.getElementById('auto-save-status')
  if (status) {
    status.className = 'auto-save-status saved'
    document.getElementById('save-text').textContent = '✓ All changes saved'

    // Hide after 3 seconds
    setTimeout(() => {
      status.className = 'auto-save-status'
    }, 3000)
  }
}

// ⭐ START AUTO-SAVE INTERVAL - CRITICAL FIX
setInterval(autoSave, 2000)  // Auto-save every 2 seconds
console.log('✅ Auto-save interval started: every 2 seconds')
// ⭐ END AUTO-SAVE INTERVAL

// Form submission should not be needed anymore, but keep for safety
const form = document.querySelector('#editor_form')
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    autoSave().then(() => {
      showSaveIndicator()
    })
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

// Real-time collaboration using Laravel Echo & WebSocket
if (docId && window.Echo) {
  console.log(`🔌 Connecting to WebSocket channel for document #${docId}`)

  // Get or create channel and explicitly subscribe
  const channel = window.Echo.channel(`editor-${docId}`)

  // Immediately attach error handler to see any subscription errors
  if (channel && typeof channel.error === 'function') {
    channel.error((err) => {
      console.error('❌ Channel subscription error:', err)
    })
  }

  const handleEditorUpdated = (event) => {
    console.log('📨 Received real-time update from another user:', event)

    // Support payloads where the broadcast payload may be nested or stringified
    const serverContentRaw = event.content ?? event.data?.content ?? event
    let serverContent
    try {
      if (typeof serverContentRaw === 'string') {
        serverContent = JSON.parse(serverContentRaw)
      } else if (serverContentRaw && serverContentRaw.content) {
        serverContent = typeof serverContentRaw.content === 'string'
          ? JSON.parse(serverContentRaw.content)
          : serverContentRaw.content
      } else {
        serverContent = serverContentRaw
      }
    } catch (e) {
      console.error('Failed to parse server content:', e)
      return
    }

    if (!serverContent) return

    const localContent = window.editor.getJSON()
    const localJSON = JSON.stringify(localContent)
    const serverJSON = JSON.stringify(serverContent)

    // Only update if content is different (avoid infinite loop)
    if (localJSON !== serverJSON) {
      // Store cursor position
      const cursorPos = window.editor.state.selection.$anchor.pos

      // Update content without adding to history
      window.editor.commands.setContent(serverContent, false)

      // Try to restore cursor position
      try {
        window.editor.commands.setTextSelection(Math.min(cursorPos, window.editor.state.doc.content.size))
      } catch (e) {
        window.editor.commands.setTextSelection(window.editor.state.doc.content.size)
      }

      // Show update notification
      showUpdateNotification('Just now')
    }
  }

  // Listen for broadcast event — this triggers subscription internally
  // The event is named 'editor.updated' per broadcastAs() in EditorUpdated event class
  channel.listen('editor.updated', handleEditorUpdated)

  // Also listen to alternative names for robustness
  channel.listen('EditorUpdated', handleEditorUpdated)
  channel.listen('App\\\\Events\\\\EditorUpdated', handleEditorUpdated)

  // Wait a tick then log subscription status
  setTimeout(() => {
    if (channel && typeof channel.subscribed === 'function') {
      channel.subscribed(() => {
        console.log(`✅ Successfully subscribed to editor-${docId} channel`)
      })
    }
    console.log(`✅ WebSocket real-time collaboration enabled for document #${docId}`)
  }, 100)
} else if (!window.Echo) {
  console.warn('⚠️ Laravel Echo not initialized - real-time updates disabled')
}

// Show update notification
function showUpdateNotification(timestamp) {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4a90e2;
    color: white;
    padding: 12px 20px;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `
  notification.textContent = `✓ Document updated by another user (${timestamp})`
  document.body.appendChild(notification)

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease'
    setTimeout(() => notification.remove(), 300)
  }, 4000)
}

// Add animation styles
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`
document.head.appendChild(style)
