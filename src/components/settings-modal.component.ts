import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService, AiProvider } from '../services/settings.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (settings.isSettingsOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="close()">
        <div class="bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" (click)="$event.stopPropagation()">
          
          <div class="p-4 border-b border-[#30363d] flex justify-between items-center">
            <h2 class="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
              Settings
            </h2>
            <button (click)="close()" class="text-[#8b949e] hover:text-[#c9d1d9]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6">
            <div class="flex gap-6">
               <!-- Sidebar of Settings (Fake) -->
               <div class="w-1/3 border-r border-[#30363d] pr-4 space-y-1">
                  <div class="px-2 py-1.5 text-xs font-semibold text-[#c9d1d9] bg-[#21262d] rounded-md border-l-2 border-[#f78166]">
                     AI Provider
                  </div>
                  <div class="px-2 py-1.5 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9] rounded-md cursor-not-allowed">
                     Appearance
                  </div>
                  <div class="px-2 py-1.5 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9] rounded-md cursor-not-allowed">
                     Account
                  </div>
               </div>
               
               <!-- Main Content -->
               <div class="flex-1 space-y-6">
                  <!-- Provider Selector -->
                  <div class="space-y-3">
                    <label class="block text-sm font-semibold text-[#c9d1d9]">Provider</label>
                    <div class="grid grid-cols-1 gap-2">
                      @for (provider of settings.providers; track provider.id) {
                        <button 
                          (click)="selectProvider(provider.id)"
                          class="flex items-center justify-between px-3 py-2 rounded-md border text-left transition-all"
                          [class.border-[#1f6feb]]="settings.activeProvider() === provider.id"
                          [class.bg-[#1f6feb1a]]="settings.activeProvider() === provider.id"
                          [class.border-[#30363d]]="settings.activeProvider() !== provider.id"
                          [class.bg-[#0d1117]]="settings.activeProvider() !== provider.id"
                          [class.hover:border-[#8b949e]]="settings.activeProvider() !== provider.id">
                          <div>
                            <div class="text-xs font-semibold" [class.text-[#58a6ff]]="settings.activeProvider() === provider.id" [class.text-[#c9d1d9]]="settings.activeProvider() !== provider.id">{{ provider.name }}</div>
                          </div>
                          @if (settings.activeProvider() === provider.id) {
                            <svg class="w-4 h-4 text-[#58a6ff]" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>
                          }
                        </button>
                      }
                    </div>
                  </div>

                  <!-- API Key Input -->
                  <div class="space-y-2 pt-4 border-t border-[#30363d]">
                    <label class="block text-sm font-semibold text-[#c9d1d9]">
                      {{ getProviderName(settings.activeProvider()) }} API Key
                    </label>
                    <input 
                      type="password" 
                      [value]="settings.getApiKey(settings.activeProvider())"
                      (input)="updateKey($event)"
                      placeholder="sk-..."
                      class="w-full bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-sm rounded-md py-1.5 px-3 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] font-mono" />
                    <p class="text-xs text-[#8b949e]">
                       Keys are stored in your browser's local storage.
                       @if (settings.activeProvider() === 'gemini') {
                          <span class="block mt-1 text-[#3fb950]">Gemini can default to env key if empty.</span>
                       }
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <div class="p-4 bg-[#161b22] border-t border-[#30363d] flex justify-end">
            <button (click)="close()" class="bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] text-white font-semibold py-1.5 px-4 rounded-md text-sm transition-colors shadow-sm">
              Save & Close
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class SettingsModalComponent {
  settings = inject(SettingsService);

  close() {
    this.settings.isSettingsOpen.set(false);
  }

  selectProvider(id: AiProvider) {
    this.settings.activeProvider.set(id);
  }

  updateKey(event: Event) {
    const key = (event.target as HTMLInputElement).value;
    this.settings.setApiKey(this.settings.activeProvider(), key);
  }

  getProviderName(id: string): string {
    return this.settings.providers.find(p => p.id === id)?.name || id;
  }
}