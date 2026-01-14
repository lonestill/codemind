import { Component, inject, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnippetService, Snippet, SnippetVersion } from '../services/snippet.service';
import { AiService } from '../services/ai.service';

declare const marked: any;
declare const Diff: any; // From CDN

type SidePanel = 'none' | 'ai' | 'history';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col bg-[#0d1117] relative">
      
      @if (snippetService.activeSnippet(); as snippet) {
        
        <!-- Toolbar -->
        <div class="h-14 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-4 z-10">
          
          <!-- Title & Lang -->
          @if (!isDiffMode()) {
            <div class="flex items-center gap-4 flex-1">
              
              <!-- Repo-like breadcrumb style title -->
              <div class="flex items-center text-[#c9d1d9] text-sm md:text-lg">
                <span class="text-[#58a6ff] hover:underline cursor-pointer opacity-80">user</span>
                <span class="mx-1 text-[#8b949e]">/</span>
                <input 
                  [value]="snippet.title" 
                  (input)="updateTitle($event, snippet.id)"
                  class="bg-transparent font-semibold text-[#c9d1d9] focus:outline-none focus:bg-[#161b22] rounded px-1 -ml-1 transition-colors border border-transparent focus:border-[#30363d] w-64"
                  placeholder="filename" />
              </div>

              <!-- Language Select Badge -->
              <div class="relative group">
                <select 
                  [value]="snippet.language" 
                  (change)="updateLang($event, snippet.id)"
                  class="appearance-none bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] text-xs font-medium py-1 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8b949e] cursor-pointer pr-6">
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="sql">SQL</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                  <option value="plaintext">Plain Text</option>
                </select>
                <!-- Custom arrow to hide default system styling -->
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#c9d1d9]">
                  <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
          } @else {
             <div class="flex items-center gap-2 flex-1">
                <div class="bg-[#6e76811a] text-[#c9d1d9] px-3 py-1 rounded-md text-sm font-medium border border-[#30363d] flex items-center gap-2">
                   <svg class="w-4 h-4 text-[#a371f7]" fill="currentColor" viewBox="0 0 16 16"><path d="M8.75 1.75a.75.75 0 0 0-1.5 0V5H4a.75.75 0 0 0 0 1.5h3.25v3.25a.75.75 0 0 0 1.5 0V6.5h3.25a.75.75 0 0 0 0-1.5H8.75V1.75Z"></path><path d="M4 13a.75.75 0 0 0 0 1.5h8a.75.75 0 1 0 0-1.5H4Z"></path></svg>
                   Diff Review
                </div>
                <span class="text-xs text-[#8b949e] ml-2">Review suggested changes</span>
             </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-2">
            @if (!isDiffMode()) {
              <!-- Secondary Buttons Group (AI Actions) -->
              <div class="flex rounded-md shadow-sm" role="group">
                <button 
                  (click)="askAI('explain')"
                  [disabled]="isLoading()"
                  class="px-3 py-1 text-xs font-medium text-[#c9d1d9] bg-[#21262d] border border-[#30363d] rounded-l-md hover:bg-[#30363d] hover:border-[#8b949e] transition-all">
                  Explain
                </button>
                <button 
                  (click)="askAI('optimize')"
                  [disabled]="isLoading()"
                  class="px-3 py-1 text-xs font-medium text-[#c9d1d9] bg-[#21262d] border-t border-b border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e] transition-all">
                  Optimize
                </button>
                <button 
                  (click)="askAI('debug')"
                  [disabled]="isLoading()"
                  class="px-3 py-1 text-xs font-medium text-[#c9d1d9] bg-[#21262d] border border-[#30363d] rounded-r-md hover:bg-[#30363d] hover:border-[#8b949e] transition-all">
                  Debug
                </button>
              </div>

              <!-- Tools -->
              <div class="flex items-center gap-1 ml-2">
                 <button 
                   (click)="saveVersion(snippet.id)"
                   class="btn-icon"
                   title="Save Version">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 1.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .53.22l5.25 5.25a.75.75 0 0 1 .22.53v6.25a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75V1.75Zm1.5 0v11.5h8.5V7.5l-4.75-4.75H5Z"></path></svg>
                 </button>

                 <button 
                   (click)="togglePanel('history')"
                   class="btn-icon"
                   [class.text-[#58a6ff]]="activePanel() === 'history'"
                   title="Version History">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3.25a.75.75 0 0 1 .75.75v3.18l1.78 1.78a.75.75 0 0 1-1.06 1.06L7.25 9.28V5.5a.75.75 0 0 1 .75-.75Z"></path></svg>
                 </button>
                 
                 <button 
                   (click)="detectLanguage()"
                   [disabled]="isDetecting()"
                   class="btn-icon"
                   title="Auto-detect Language">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5h-3.32Z"></path></svg>
                 </button>

                 <button 
                   (click)="deleteSnippet(snippet.id)"
                   class="btn-icon text-[#f85149] hover:bg-[rgba(248,81,73,0.1)] hover:text-[#f85149]"
                   title="Delete Snippet">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.75 1.75 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg>
                 </button>
              </div>

            } @else {
              <!-- Diff Actions -->
              <button 
                (click)="cancelDiff()"
                class="px-3 py-1.5 text-xs font-medium text-[#c9d1d9] bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] transition-colors">
                Cancel
              </button>
              <button 
                (click)="acceptDiff(snippet.id)"
                class="px-3 py-1.5 text-xs font-medium text-white bg-[#238636] border border-[rgba(240,246,252,0.1)] rounded-md hover:bg-[#2ea043] shadow-sm flex items-center gap-1">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>
                Commit Changes
              </button>
            }
          </div>
        </div>

        <!-- Content Area with File Border look -->
        <div class="flex-1 flex overflow-hidden relative p-4 bg-[#0d1117]">
          
          <!-- Outer border for Editor "Box" like GitHub file view -->
          <div class="flex-1 border border-[#30363d] rounded-md flex overflow-hidden relative bg-[#0d1117] shadow-sm">
            
            @if (!isDiffMode()) {
              <!-- Standard Code Editor -->
              <div class="flex-1 relative flex flex-col group">
                <!-- Line Numbers -->
                <div class="absolute left-0 top-0 bottom-0 w-12 bg-[#0d1117] border-r border-[#30363d] text-[#6e7681] font-mono text-[13px] pt-4 text-right pr-3 select-none pointer-events-none overflow-hidden z-0 hidden md:block leading-[1.5rem]">
                  @for (line of getLineNumbers(snippet.code); track $index) {
                    <div>{{line}}</div>
                  }
                </div>

                <textarea
                  #editorArea
                  [value]="snippet.code"
                  (input)="updateCode($event, snippet.id)"
                  (keydown.control.space)="$event.preventDefault(); triggerAutocomplete(snippet.id, snippet.language)"
                  spellcheck="false"
                  class="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-4 md:pl-16 font-mono text-[13px] resize-none focus:outline-none leading-[1.5rem] selection:bg-[#1f6feb] selection:text-white">
                </textarea>
                
                <div class="absolute bottom-2 right-4 text-xs text-[#8b949e] px-2 py-1 rounded pointer-events-none">
                  {{ snippet.code.length }} bytes
                </div>
              </div>
            } @else {
               <!-- Diff Viewer -->
               <div class="flex-1 bg-[#0d1117] overflow-auto flex flex-col relative custom-scrollbar">
                  <div class="flex-1 font-mono text-[13px] leading-[1.5rem]">
                     @for (part of diffChanges(); track $index) {
                        <div 
                           [class]="getDiffClass(part)"
                           class="whitespace-pre-wrap break-all px-4 py-0.5 border-l-[3px]">
                           <span class="inline-block w-4 mr-2 text-[#6e7681] select-none">{{ part.added ? '+' : (part.removed ? '-' : ' ') }}</span>{{ part.value }}
                        </div>
                     }
                  </div>
               </div>
            }
            
            <!-- Side Panel (AI or History) Overlay -->
            @if (activePanel() !== 'none') {
              <div class="w-96 border-l border-[#30363d] bg-[#0d1117] flex flex-col z-20 absolute right-0 top-0 bottom-0 md:relative">
                
                <!-- Panel Header -->
                <div class="flex items-center justify-between p-3 border-b border-[#30363d] bg-[#161b22]">
                  <h3 class="font-semibold text-[#c9d1d9] text-sm flex items-center gap-2">
                    @if (activePanel() === 'ai') {
                      <svg class="w-4 h-4 text-[#a371f7]" viewBox="0 0 16 16" fill="currentColor"><path d="M4.442 12.339a.75.75 0 0 1 .493-1.417A24.898 24.898 0 0 0 13.067 5.77a.75.75 0 0 1 1.417.493 26.398 26.398 0 0 1-8.621 5.485.75.75 0 0 1-1.421.59Zm6.386.586a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1-1.06 1.061l-2-2a.75.75 0 0 1 0-1.06ZM.75 5.5a.75.75 0 0 1 .75-.75 24.898 24.898 0 0 1 5.15 8.132.75.75 0 0 1-1.417.493A26.398 26.398 0 0 0 2.933 6.917a.75.75 0 0 1-2.183-1.417Zm3.71-3.71a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.061 1.06l-2 2a.75.75 0 0 1-1.06 0Z"></path></svg>
                      Copilot Chat
                    } @else {
                      <svg class="w-4 h-4 text-[#8b949e]" viewBox="0 0 16 16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3.25a.75.75 0 0 1 .75.75v3.18l1.78 1.78a.75.75 0 0 1-1.06 1.06L7.25 9.28V5.5a.75.75 0 0 1 .75-.75Z"></path></svg>
                      History
                    }
                  </h3>
                  @if (!isDiffMode()) {
                     <button (click)="closePanel()" class="text-[#8b949e] hover:text-[#c9d1d9]">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  }
                </div>
                
                <!-- Panel Content -->
                <div class="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0d1117]">
                  @if (activePanel() === 'ai') {
                    @if (isLoading()) {
                      <div class="flex flex-col items-center justify-center h-40 space-y-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#58a6ff]"></div>
                        <p class="text-[#8b949e] text-xs">Generating response...</p>
                      </div>
                    } @else {
                      <div class="markdown-body text-sm" [innerHTML]="aiResponseHtml()"></div>
                    }
                  } @else {
                     <!-- History List -->
                     @if (snippet.history.length === 0) {
                        <div class="text-center text-[#8b949e] text-sm py-8">
                           No changes saved.
                        </div>
                     } @else {
                        <div class="relative pl-2 border-l border-[#30363d] space-y-6 my-2">
                           @for (version of snippet.history; track version.timestamp) {
                              <div class="relative pl-4">
                                 <!-- Timeline dot -->
                                 <div class="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[#30363d] border-2 border-[#0d1117]"></div>
                                 
                                 <div class="flex flex-col gap-1">
                                    <div class="text-xs text-[#8b949e]">
                                       {{ version.timestamp | date:'MMM d, HH:mm' }}
                                    </div>
                                    <div class="bg-[#161b22] border border-[#30363d] rounded p-2 text-xs font-mono text-[#8b949e] truncate hover:text-[#c9d1d9] cursor-pointer" (click)="restoreVersion(snippet.id, version)">
                                       {{ version.code.slice(0, 60) }}...
                                    </div>
                                 </div>
                              </div>
                           }
                        </div>
                     }
                  }
                </div>
              </div>
            }

          </div>
        </div>

      } @else {
        <div class="flex-1 flex flex-col items-center justify-center text-[#8b949e] bg-[#0d1117]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <p class="text-sm">Select a snippet to view code</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .btn-icon {
      @apply p-1.5 rounded-md text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] transition-colors;
    }
  `]
})
export class EditorComponent {
  snippetService = inject(SnippetService);
  aiService = inject(AiService);

  @ViewChild('editorArea') editorArea!: ElementRef<HTMLTextAreaElement>;

  activePanel = signal<SidePanel>('none');
  isLoading = signal(false);
  isDetecting = signal(false);
  isCompleting = signal(false);
  
  aiResponse = signal('');
  aiResponseHtml = signal('');
  
  // Diff State
  isDiffMode = signal(false);
  suggestedCode = signal('');
  diffChanges = signal<any[]>([]);

  constructor() {
    effect(() => {
      const raw = this.aiResponse();
      if (typeof marked !== 'undefined') {
        this.aiResponseHtml.set(marked.parse(raw));
      } else {
        this.aiResponseHtml.set(raw);
      }
    });
  }

  togglePanel(panel: SidePanel) {
    if (this.activePanel() === panel) {
      this.activePanel.set('none');
    } else {
      this.activePanel.set(panel);
    }
  }

  closePanel() {
    this.activePanel.set('none');
  }

  updateTitle(event: Event, id: string) {
    const title = (event.target as HTMLInputElement).value;
    this.snippetService.updateSnippet(id, { title });
  }

  updateLang(event: Event, id: string) {
    const language = (event.target as HTMLSelectElement).value;
    this.snippetService.updateSnippet(id, { language });
  }

  updateCode(event: Event, id: string) {
    const code = (event.target as HTMLTextAreaElement).value;
    this.snippetService.updateSnippet(id, { code });
  }

  deleteSnippet(id: string) {
    if (confirm('Are you sure you want to delete this snippet?')) {
      this.snippetService.deleteSnippet(id);
    }
  }

  async detectLanguage() {
    const snippet = this.snippetService.activeSnippet();
    if (!snippet || !snippet.code.trim()) return;

    this.isDetecting.set(true);
    try {
      const lang = await this.aiService.detectLanguage(snippet.code);
      this.snippetService.updateSnippet(snippet.id, { language: lang });
    } catch (e) {
      console.error('Failed to detect language', e);
      alert('Failed to detect language. Please check your API key in settings.');
    } finally {
      this.isDetecting.set(false);
    }
  }

  async askAI(mode: 'explain' | 'optimize' | 'debug') {
    const snippet = this.snippetService.activeSnippet();
    if (!snippet) return;

    this.activePanel.set('ai');
    this.isLoading.set(true);
    this.aiResponse.set('');
    this.isDiffMode.set(false);

    try {
      const result = await this.aiService.analyzeCode(snippet.code, mode);
      this.aiResponse.set(result.text);

      if (result.suggestedCode && (mode === 'optimize' || mode === 'debug')) {
        this.suggestedCode.set(result.suggestedCode);
        this.computeDiff(snippet.code, result.suggestedCode);
        this.isDiffMode.set(true);
      }
    } catch (e: any) {
      this.aiResponse.set(`**Error:** ${e.message || 'Unknown error occurred'}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  async triggerAutocomplete(id: string, language: string) {
    if (this.isCompleting()) return;
    
    const textarea = this.editorArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const code = textarea.value;
    
    const before = code.substring(0, start);
    const after = code.substring(end);

    this.isCompleting.set(true);
    try {
      const completion = await this.aiService.completeCode(before, after, language);
      
      if (completion) {
        // Insert text
        const newCode = before + completion + after;
        this.snippetService.updateSnippet(id, { code: newCode });
        
        // Restore cursor position + added text length
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + completion.length, start + completion.length);
        });
      }
    } catch (e) {
      console.error(e);
      alert('Autocomplete failed');
    } finally {
      this.isCompleting.set(false);
    }
  }

  saveVersion(id: string) {
     this.snippetService.saveVersion(id);
  }

  restoreVersion(id: string, version: SnippetVersion) {
     if(confirm(`Restore version from ${new Date(version.timestamp).toLocaleString()}? Current changes will be lost unless saved as a version.`)) {
        this.snippetService.restoreVersion(id, version);
     }
  }

  computeDiff(oldCode: string, newCode: string) {
    if (typeof Diff !== 'undefined') {
      const changes = Diff.diffLines(oldCode, newCode);
      this.diffChanges.set(changes);
    } else {
      console.error('Diff library not loaded');
      this.diffChanges.set([{ value: newCode, added: true }]);
    }
  }

  getDiffClass(part: any): string {
    // GitHub Diff Colors (approx)
    // Add: bg-[#2ea04326] (Green tint)
    // Remove: bg-[#f8514926] (Red tint)
    if (part.added) {
      return 'bg-[rgba(46,160,67,0.15)] border-[#2ea043]';
    } else if (part.removed) {
      return 'bg-[rgba(248,81,73,0.15)] border-[#f85149] opacity-70';
    }
    return 'border-transparent text-[#8b949e] opacity-60';
  }

  acceptDiff(id: string) {
    this.snippetService.saveVersion(id);
    const newCode = this.suggestedCode();
    if (newCode) {
      this.snippetService.updateSnippet(id, { code: newCode });
      this.isDiffMode.set(false);
    }
  }

  cancelDiff() {
    this.isDiffMode.set(false);
  }

  closeAiPanel() {
    this.activePanel.set('none');
  }

  getLineNumbers(code: string): number[] {
    const count = code.split('\n').length;
    const safeCount = Math.min(count, 999);
    return Array.from({length: safeCount}, (_, i) => i + 1);
  }
}