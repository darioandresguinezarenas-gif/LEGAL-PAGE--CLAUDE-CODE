// TipTap mount helper para el panel admin.
// Uso:
//   const editor = mountRichEditor(rootEl, { content: '<p>hola</p>', placeholder: '…' });
//   editor.getHTML();   // → string HTML actual
//   editor.setHTML(s);  // reemplaza el contenido
//   editor.destroy();   // limpiar al cerrar modal
//
// CSP: TipTap se importa como módulo ESM y Astro lo bundlea a /_astro/*.js
// (compatible con script-src 'self'). DOMPurify sanitiza al guardar.

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';

// ── Esquema de etiquetas/atributos permitidos al guardar/renderizar ──
// Debe sincronizarse con src/lib/sanitize.ts (segunda capa en SSG).
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 's',
  'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'hr',
];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function sanitizeRich(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: false,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Monta un TipTap dentro de `rootEl`, esperando esta estructura mínima
 * (la genera RichEditor.astro):
 *   <div class="rich-editor">
 *     <div class="rich-toolbar">…</div>
 *     <div class="rich-content"></div>
 *   </div>
 *
 * Devuelve un wrapper con getHTML/setHTML/destroy.
 */
export function mountRichEditor(rootEl, { content = '', placeholder = 'Escriba aquí…' } = {}) {
  const contentEl = rootEl.querySelector('.rich-content');
  const toolbarEl = rootEl.querySelector('.rich-toolbar');
  if (!contentEl) throw new Error('mountRichEditor: falta .rich-content dentro del root');

  const editor = new Editor({
    element: contentEl,
    extensions: [
      StarterKit.configure({
        // El blockquote y horizontal rule vienen por StarterKit; mantenemos defaults.
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'rich-prose',
        spellcheck: 'true',
      },
    },
  });

  // ── Toolbar ────────────────────────────────────────────────────
  if (toolbarEl) wireToolbar(toolbarEl, editor);

  return {
    editor,
    getHTML: () => sanitizeRich(editor.getHTML()),
    getRawHTML: () => editor.getHTML(),
    setHTML: (html) => editor.commands.setContent(html || '', false),
    isEmpty: () => editor.isEmpty,
    focus: () => editor.commands.focus(),
    destroy: () => editor.destroy(),
  };
}

// ── Toolbar wiring ───────────────────────────────────────────────
function wireToolbar(toolbarEl, editor) {
  const buttons = toolbarEl.querySelectorAll('[data-cmd]');

  const ACTIONS = {
    bold:        () => editor.chain().focus().toggleBold().run(),
    italic:      () => editor.chain().focus().toggleItalic().run(),
    strike:      () => editor.chain().focus().toggleStrike().run(),
    h2:          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    h3:          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    h4:          () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
    p:           () => editor.chain().focus().setParagraph().run(),
    ul:          () => editor.chain().focus().toggleBulletList().run(),
    ol:          () => editor.chain().focus().toggleOrderedList().run(),
    blockquote:  () => editor.chain().focus().toggleBlockquote().run(),
    hr:          () => editor.chain().focus().setHorizontalRule().run(),
    undo:        () => editor.chain().focus().undo().run(),
    redo:        () => editor.chain().focus().redo().run(),
    clear:       () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
    link:        () => {
      const previous = editor.getAttributes('link').href || '';
      const url = window.prompt('URL del enlace (deja vacío para quitar):', previous);
      if (url === null) return;
      if (url === '') {
        editor.chain().focus().unsetLink().run();
        return;
      }
      if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
        alert('La URL debe comenzar con http://, https:// o mailto:');
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    },
  };

  buttons.forEach((btn) => {
    btn.addEventListener('mousedown', (e) => e.preventDefault()); // mantiene la selección
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      ACTIONS[cmd]?.();
    });
  });

  // Reflejar estado activo de marks/nodes en los botones
  editor.on('selectionUpdate', () => refreshActive(buttons, editor));
  editor.on('transaction',     () => refreshActive(buttons, editor));
  refreshActive(buttons, editor);
}

function refreshActive(buttons, editor) {
  buttons.forEach((btn) => {
    const cmd = btn.dataset.cmd;
    let active = false;
    switch (cmd) {
      case 'bold':       active = editor.isActive('bold'); break;
      case 'italic':     active = editor.isActive('italic'); break;
      case 'strike':     active = editor.isActive('strike'); break;
      case 'h2':         active = editor.isActive('heading', { level: 2 }); break;
      case 'h3':         active = editor.isActive('heading', { level: 3 }); break;
      case 'h4':         active = editor.isActive('heading', { level: 4 }); break;
      case 'ul':         active = editor.isActive('bulletList'); break;
      case 'ol':         active = editor.isActive('orderedList'); break;
      case 'blockquote': active = editor.isActive('blockquote'); break;
      case 'link':       active = editor.isActive('link'); break;
    }
    btn.classList.toggle('active', active);
  });
}
