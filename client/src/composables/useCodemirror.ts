import { ref, onUnmounted } from 'vue';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment, Prec } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { openSearchPanel } from '@codemirror/search';

/** App-aware CM6 base theme using CSS variables */
const appTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    caretColor: 'rgb(var(--fg))',
    outline: 'none',
  },
  '.cm-content:focus, .cm-content:focus-visible': {
    outline: 'none',
    boxShadow: 'none',
    borderRadius: '0',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'rgb(var(--fg))',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'rgb(var(--primary) / 0.25)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgb(var(--fg) / 0.04)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'rgb(var(--muted))',
    borderRight: '1px solid rgb(var(--border))',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgb(var(--fg) / 0.04)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
});

const appThemeDark = EditorView.theme(
  {
    '.cm-activeLine': {
      backgroundColor: 'rgb(var(--fg) / 0.06)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgb(var(--fg) / 0.06)',
    },
  },
  { dark: true }
);

export interface UseCodemirrorOptions {
  doc?: string;
  readOnly?: boolean;
  dark?: boolean;
  onSave?: (doc: string) => void;
}

function buildThemeExtension(isDark: boolean) {
  return isDark ? [oneDark, appThemeDark] : [];
}

export function useCodemirror(options: UseCodemirrorOptions = {}) {
  const view = ref<EditorView | null>(null);
  const readOnlyComp = new Compartment();
  const themeComp = new Compartment();

  function create(container: HTMLElement) {
    const extraKeymaps: { key: string; mac?: string; run: (v: EditorView) => boolean }[] = [
      // Ctrl+H → open search panel (replace mode uses same panel)
      {
        key: 'Mod-h',
        run: (v) => {
          openSearchPanel(v);
          return true;
        },
      },
    ];

    if (options.onSave) {
      extraKeymaps.push({
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          options.onSave!(getDoc());
          return true;
        },
      });
    }

    const state = EditorState.create({
      doc: options.doc ?? '',
      extensions: [
        // High-priority keymaps so they aren't overridden
        Prec.highest(keymap.of(extraKeymaps)),
        basicSetup,
        markdown({ codeLanguages: languages }),
        appTheme,
        themeComp.of(buildThemeExtension(options.dark ?? false)),
        readOnlyComp.of([
          EditorState.readOnly.of(options.readOnly ?? false),
          EditorView.editable.of(!(options.readOnly ?? false)),
        ]),
        EditorView.lineWrapping,
      ],
    });

    view.value = new EditorView({ state, parent: container });
  }

  function getDoc(): string {
    return view.value?.state.doc.toString() ?? '';
  }

  function setDoc(doc: string) {
    const v = view.value;
    if (!v) return;
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: doc },
    });
  }

  function setReadOnly(ro: boolean) {
    view.value?.dispatch({
      effects: readOnlyComp.reconfigure([
        EditorState.readOnly.of(ro),
        EditorView.editable.of(!ro),
      ]),
    });
  }

  function setDark(isDark: boolean) {
    view.value?.dispatch({
      effects: themeComp.reconfigure(buildThemeExtension(isDark)),
    });
  }

  function destroy() {
    view.value?.destroy();
    view.value = null;
  }

  function focus() {
    view.value?.focus();
  }

  onUnmounted(destroy);

  return { view, create, getDoc, setDoc, setReadOnly, setDark, destroy, focus };
}
