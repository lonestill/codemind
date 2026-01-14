import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnippetListComponent } from './components/snippet-list.component';
import { EditorComponent } from './components/editor.component';
import { SettingsModalComponent } from './components/settings-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SnippetListComponent, EditorComponent, SettingsModalComponent],
  template: `
    <div class="flex h-screen w-full bg-[#0d1117] text-[#c9d1d9]">
      <app-snippet-list></app-snippet-list>
      <div class="flex-1 overflow-hidden">
        <app-editor></app-editor>
      </div>
      <app-settings-modal></app-settings-modal>
    </div>
  `
})
export class AppComponent {}