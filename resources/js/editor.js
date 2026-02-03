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
// Handles both /editor/{id} and /editor/{id}/edit routes
let urlPath = window.location.pathname
let docIdMatch = urlPath.match(/\/editor\/(\d+)(?:\/edit)?/)
let docId = docIdMatch ? docIdMatch[1] : null

if (docId) {
  console.log(`📄 Document ID detected: ${docId}`)
}

// Auto-save function - saves without page reload
let lastSavedContent = JSON.stringify(window.editor.getJSON())
let isSaving = false
let lastSentContent = null // Track content we just sent to prevent processing our own updates

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
      const responseData = await response.json()
      lastSavedContent = currentContent
      lastSentContent = currentContent // Track what we just sent
      window.editorModified = false
      console.log('💾 Auto-saved at', new Date().toLocaleTimeString())
      showSavedStatus()

      // Update last known timestamp from server response to avoid polling our own update
      if (responseData.updated_at) {
        // The polling will pick up the new timestamp on next poll
        // We set lastSentContent to prevent applying our own update
      }

      // Clear the sent content tracker after a short delay
      // This allows us to ignore our own poll response but accept future updates
      setTimeout(() => {
        if (lastSentContent === currentContent) {
          lastSentContent = null
        }
      }, 3000) // Clear after 3 seconds (longer than poll interval)
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

// Form submission handler
const form = document.querySelector('#editor_form')
if (form) {
  form.addEventListener('submit', async (e) => {
    // For new documents (no docId), allow normal form submission
    if (!docId) {
      // Update hidden input before submit
      if (inputElement) {
        inputElement.value = JSON.stringify(window.editor.getJSON())
      }
      // Let form submit normally to create the document
      return true
    }

    // For existing documents, prevent default and use auto-save
    e.preventDefault()
    await autoSave()
    showSavedStatus()
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

// Real-time collaboration using AJAX Long Polling
if (docId) {
  console.log(`🔄 Starting long polling for document #${docId}`)

  // Track if we're currently applying a remote update to prevent loops
  let isApplyingRemoteUpdate = false
  let lastKnownTimestamp = null
  let pollingInterval = null
  let isPolling = false

  // Function to check for updates from server
  const checkForUpdates = async () => {
    // Don't poll if already polling or applying update
    if (isPolling || isApplyingRemoteUpdate) {
      return
    }

    isPolling = true

    try {
      const response = await fetch(`/editor/${docId}/poll`)

      if (!response.ok) {
        console.warn('⚠️ Poll request failed:', response.status)
        isPolling = false
        return
      }

      const data = await response.json()

      // Check if content has been updated (compare timestamps)
      if (lastKnownTimestamp && data.updated_at && data.updated_at > lastKnownTimestamp) {
        console.log('📨 Content updated on server, applying changes...')

        // Parse the content JSON
        let serverContent
        try {
          if (typeof data.content_json === 'string') {
            serverContent = JSON.parse(data.content_json)
          } else {
            serverContent = data.content_json
          }
        } catch (e) {
          console.error('❌ Failed to parse server content:', e)
          isPolling = false
          return
        }

        if (!serverContent) {
          console.warn('⚠️ Server content is empty')
          isPolling = false
          return
        }

        const localContent = window.editor.getJSON()
        const localJSON = JSON.stringify(localContent)
        const serverJSON = JSON.stringify(serverContent)

        // Ignore if this is our own update (we just sent this content)
        if (lastSentContent && serverJSON === lastSentContent) {
          console.log('🔄 Ignoring own update (content matches what we just sent)')
          lastSentContent = null
          lastKnownTimestamp = data.updated_at
          isPolling = false
          return
        }

        // Only update if content is different
        if (localJSON !== serverJSON) {
          console.log('🔄 Applying remote update (content differs)')
          isApplyingRemoteUpdate = true

          // Store cursor position
          const { from, to } = window.editor.state.selection

          // Update content without adding to history
          window.editor.commands.setContent(serverContent, false)

          // Update title if changed
          if (data.title && document.querySelector('#editor_title')) {
            const titleInput = document.querySelector('#editor_title')
            if (titleInput.value !== data.title) {
              titleInput.value = data.title
            }
          }

          // Try to restore cursor position after a brief delay
          setTimeout(() => {
            try {
              const docSize = window.editor.state.doc.content.size
              const newFrom = Math.min(from, docSize)
              const newTo = Math.min(to, docSize)
              window.editor.commands.setTextSelection({ from: newFrom, to: newTo })
            } catch (e) {
              // If selection fails, just move to end
              window.editor.commands.setTextSelection(window.editor.state.doc.content.size)
            }
            isApplyingRemoteUpdate = false
          }, 50)

          // Update last saved content to match server
          lastSavedContent = serverJSON
          lastKnownTimestamp = data.updated_at

          // Show update notification
          showUpdateNotification(data.updated_at_human || 'Just now')
        } else {
          // Content matches, just update timestamp
          lastKnownTimestamp = data.updated_at
        }
      } else if (!lastKnownTimestamp) {
        // First poll - just store the timestamp
        lastKnownTimestamp = data.updated_at
        console.log('✅ Initial poll complete, timestamp:', lastKnownTimestamp)
      }
    } catch (error) {
      console.error('❌ Poll error:', error)
    } finally {
      isPolling = false
    }
  }

  // Start polling every 2 seconds
  const POLL_INTERVAL = 2000 // 2 seconds

  // Initial poll after 1 second
  setTimeout(() => {
    checkForUpdates()
  }, 1000)

  // Set up interval polling
  pollingInterval = setInterval(checkForUpdates, POLL_INTERVAL)

  console.log(`✅ Long polling enabled for document #${docId} (every ${POLL_INTERVAL}ms)`)

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
  })
} else {
  console.log('ℹ️ No document ID found - polling disabled (new document)')
}

// Show update notification
function showUpdateNotification(timestamp) {
//   const notification = document.createElement('div')
//   notification.style.cssText = `
//     position: fixed;
//     bottom: 20px;
//     right: 20px;
//     background: #4a90e2;
//     color: white;
//     padding: 12px 20px;
//     border-radius: 0.5rem;
//     font-size: 0.875rem;
//     z-index: 9999;
//     animation: slideIn 0.3s ease;
//   `
//   notification.textContent = ``
//   document.body.appendChild(notification)

//   // Auto-remove after 4 seconds
//   setTimeout(() => {
//     notification.style.animation = 'fadeOut 0.3s ease'
//     setTimeout(() => notification.remove(), 300)
//   }, 4000)
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
