import { Injectable, signal, computed } from '@angular/core';

export interface SnippetVersion {
  timestamp: number;
  code: string;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: number;
  history: SnippetVersion[];
}

@Injectable({
  providedIn: 'root'
})
export class SnippetService {
  private snippetsSignal = signal<Snippet[]>(this.loadSnippets());
  public searchQuery = signal<string>('');
  public selectedSnippetId = signal<string | null>(null);

  // Derived state: Filtered snippets based on search
  public filteredSnippets = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const all = this.snippetsSignal();
    if (!query) return all.sort((a, b) => b.createdAt - a.createdAt);
    
    return all.filter(s => 
      s.title.toLowerCase().includes(query) || 
      s.language.toLowerCase().includes(query)
    ).sort((a, b) => b.createdAt - a.createdAt);
  });

  public activeSnippet = computed(() => {
    const id = this.selectedSnippetId();
    return this.snippetsSignal().find(s => s.id === id) || null;
  });

  constructor() {}

  private loadSnippets(): Snippet[] {
    const saved = localStorage.getItem('codemind_snippets');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure history exists on loaded snippets
      return parsed.map((s: any) => ({ ...s, history: s.history || [] }));
    }
    // Default seed data
    return [
      {
        id: '1',
        title: 'Binary Search Implementation',
        language: 'typescript',
        code: 'function binarySearch(arr: number[], target: number): number {\n  let left = 0;\n  let right = arr.length - 1;\n\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}',
        createdAt: Date.now(),
        history: []
      },
      {
        id: '2',
        title: 'React UseEffect Hook',
        language: 'javascript',
        code: 'useEffect(() => {\n  const subscription = props.source.subscribe();\n  return () => {\n    subscription.unsubscribe();\n  };\n}, [props.source]);',
        createdAt: Date.now() - 100000,
        history: []
      }
    ];
  }

  private saveSnippets(snippets: Snippet[]) {
    localStorage.setItem('codemind_snippets', JSON.stringify(snippets));
    this.snippetsSignal.set(snippets);
  }

  addSnippet(title: string, language: string) {
    const newSnippet: Snippet = {
      id: crypto.randomUUID(),
      title: title || 'Untitled Snippet',
      language: language || 'plaintext',
      code: '// Start typing your code here...',
      createdAt: Date.now(),
      history: []
    };
    const current = this.snippetsSignal();
    this.saveSnippets([newSnippet, ...current]);
    this.selectedSnippetId.set(newSnippet.id);
  }

  updateSnippet(id: string, updates: Partial<Snippet>) {
    const current = this.snippetsSignal();
    const updated = current.map(s => s.id === id ? { ...s, ...updates } : s);
    this.saveSnippets(updated);
  }

  deleteSnippet(id: string) {
    const current = this.snippetsSignal();
    this.saveSnippets(current.filter(s => s.id !== id));
    if (this.selectedSnippetId() === id) {
      this.selectedSnippetId.set(null);
    }
  }

  selectSnippet(id: string) {
    this.selectedSnippetId.set(id);
  }

  saveVersion(id: string) {
    const current = this.snippetsSignal();
    const snippet = current.find(s => s.id === id);
    if (!snippet) return;

    const newVersion: SnippetVersion = {
      timestamp: Date.now(),
      code: snippet.code
    };

    const updated = current.map(s => 
      s.id === id 
        ? { ...s, history: [newVersion, ...s.history].slice(0, 50) } // Limit history to 50 items
        : s
    );
    this.saveSnippets(updated);
  }

  restoreVersion(id: string, version: SnippetVersion) {
    // When restoring, we overwrite current code.
    this.updateSnippet(id, { code: version.code });
  }
}