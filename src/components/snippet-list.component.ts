import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnippetService } from '../services/snippet.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-snippet-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col bg-[#0d1117] border-r border-[#30363d] w-72 flex-shrink-0">
      <!-- Header -->
      <div class="p-4 border-b border-[#30363d]">
        <div class="flex items-center gap-2 mb-4 text-[#c9d1d9]">
          <svg class="w-6 h-6" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
          </svg>
          <span class="font-semibold text-sm">CodeMind</span>
        </div>
        <button 
          (click)="createNew()"
          class="w-full bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
          New Snippet
        </button>
      </div>

      <!-- Search -->
      <div class="p-3">
        <div class="relative">
          <input 
            type="text" 
            placeholder="Find a repository..." 
            [value]="snippetService.searchQuery()"
            (input)="onSearch($event)"
            class="w-full bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-sm rounded-md py-1.5 pl-8 pr-3 placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#8b949e] absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        @if (snippetService.filteredSnippets().length === 0) {
          <div class="p-6 text-center text-[#8b949e] text-sm">
            No snippets found.
          </div>
        }

        @for (snippet of snippetService.filteredSnippets(); track snippet.id) {
          <div 
            (click)="select(snippet.id)"
            class="group cursor-pointer px-4 py-3 border-b border-[#21262d] hover:bg-[#161b22] transition-colors relative"
            [class.bg-[#161b22]]="snippetService.selectedSnippetId() === snippet.id">
            
            @if (snippetService.selectedSnippetId() === snippet.id) {
               <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-[#f78166]"></div>
            }

            <div class="flex justify-between items-start mb-1">
              <h3 class="text-sm font-semibold text-[#58a6ff] hover:underline truncate w-full">
                {{ snippet.title }}
              </h3>
            </div>
            
            <div class="flex items-center gap-2 mt-1.5">
              <div class="flex items-center gap-1">
                 <span class="w-2.5 h-2.5 rounded-full inline-block" [style.background-color]="getLangColor(snippet.language)"></span>
                 <span class="text-xs text-[#8b949e]">
                   {{ snippet.language }}
                 </span>
              </div>
              <span class="text-xs text-[#8b949e]">
                 Updated {{ formatDate(snippet.createdAt) }}
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Settings Trigger -->
      <div class="p-3 border-t border-[#30363d]">
        <button 
          (click)="openSettings()"
          class="w-full flex items-center justify-start gap-2 text-[#c9d1d9] hover:text-[#58a6ff] py-1.5 px-2 rounded text-sm font-medium transition-colors hover:bg-[#161b22]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  `
})
export class SnippetListComponent {
  snippetService = inject(SnippetService);
  settingsService = inject(SettingsService);

  createNew() {
    this.snippetService.addSnippet('untitled-snippet', 'plaintext');
  }

  select(id: string) {
    this.snippetService.selectSnippet(id);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.snippetService.searchQuery.set(target.value);
  }

  openSettings() {
    this.settingsService.toggleSettings();
  }

  formatDate(ts: number): string {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Simple relative time for GitHub feel
    if (diff < 3600000) return 'just now';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  getLangColor(lang: string): string {
    // GitHub language colors
    const map: Record<string, string> = {
      typescript: '#3178c6',
      javascript: '#f1e05a',
      html: '#e34c26',
      css: '#563d7c',
      python: '#3572A5',
      java: '#b07219',
      sql: '#e38c00',
      json: '#292929',
      markdown: '#083fa1',
      plaintext: '#8b949e'
    };
    return map[lang.toLowerCase()] || '#8b949e';
  }
}