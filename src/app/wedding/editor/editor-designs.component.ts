import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { EditorStore } from './editor-store';

/**
 * Phương án: pick, rename, duplicate, add, compare or delete the designs
 * kept in this browser. Works on the editor page's store.
 */
@Component({
  selector: 'app-editor-designs',
  template: `
    <div class="ds">
      @if (renaming()) {
        <label class="ds__field">
          <span>Tên phương án</span>
          <input #name [value]="store.active().name" (keydown.enter)="rename(name.value)" (keydown.escape)="renaming.set(false)" (blur)="rename(name.value)" />
        </label>
      } @else {
        <label class="ds__field">
          <span>Phương án ({{ store.book().items.length }})</span>
          <select (change)="open($any($event.target).value)">
            @for (item of store.book().items; track item.id) {
              <option [value]="item.id" [selected]="item.id === store.active().id">{{ item.name }}</option>
            }
          </select>
        </label>
      }
      <div class="ds__actions">
        <button type="button" (click)="renaming.set(true)">Đổi tên</button>
        <button type="button" (click)="store.duplicate(); opened.emit()">Nhân bản</button>
        <button type="button" (click)="store.addBlank(); opened.emit()">＋ Mới</button>
        @if (store.book().items.length > 1) {
          <button type="button" (click)="compare.emit()">So sánh</button>
        }
        <button type="button" [class.ds__danger]="confirmRemove()" (click)="remove()">{{ confirmRemove() ? 'Bấm lần nữa để xóa' : 'Xóa' }}</button>
      </div>
    </div>
  `,
  styles: [
    '.ds { display: grid; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid var(--ed-line); }',
    '.ds__field { display: grid; gap: 4px; font-size: 12px; font-weight: 600; color: var(--ed-muted); }',
    '.ds__field :is(input, select) { min-height: 36px; padding: 6px 10px; border: 1px solid var(--ed-line); border-radius: 8px; background: #fff; color: var(--ed-text); font: inherit; font-size: 14px; font-weight: 600; }',
    '.ds__actions { display: flex; flex-wrap: wrap; gap: 6px; }',
    '.ds__actions button { padding: 6px 11px; border: 1px solid var(--ed-line); border-radius: 999px; background: var(--ed-panel); color: var(--ed-text); font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }',
    '.ds__actions .ds__danger { border-color: #c0392b; color: #c0392b; }',
  ],
  standalone: false,
})
export class EditorDesignsComponent {
  readonly store = inject(EditorStore);
  /** Another design is now open. */
  @Output() readonly opened = new EventEmitter<void>();
  @Output() readonly compare = new EventEmitter<void>();

  readonly renaming = signal(false);
  readonly confirmRemove = signal(false);

  open(id: string): void {
    this.store.open(id);
    this.opened.emit();
  }

  rename(name: string): void {
    this.store.rename(name);
    this.renaming.set(false);
  }

  remove(): void {
    if (!this.confirmRemove()) {
      this.confirmRemove.set(true);
      setTimeout(() => this.confirmRemove.set(false), 4000);
      return;
    }
    this.confirmRemove.set(false);
    this.store.removeActive();
    this.opened.emit();
  }
}
