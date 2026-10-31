import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Choice } from './editor-options';

/**
 * One editor option row: a labelled group of buttons, each a choice (with a
 * small outline thumbnail when the choice is a shape). Behaves as a radio
 * group: the current value is pressed.
 */
@Component({
  selector: 'app-editor-choices',
  template: `
    <fieldset class="ch" [class.ch--thumbs]="hasThumbs">
      <legend class="ch__legend">{{ legend }}</legend>
      <div class="ch__list">
        @for (choice of choices; track choice.value) {
          <button
            type="button"
            class="ch__item"
            [class.ch__item--on]="choice.value === value"
            [attr.aria-pressed]="choice.value === value"
            (click)="pick.emit(choice.value)"
          >
            @if (choice.thumb; as t) {
              <svg class="ch__thumb" [attr.viewBox]="t.box" aria-hidden="true">
                <path [attr.d]="t.d" [attr.fill-rule]="t.evenOdd ? 'evenodd' : null" />
              </svg>
            }
            <span class="ch__label">{{ choice.label }}</span>
          </button>
        }
      </div>
    </fieldset>
  `,
  styleUrls: ['./editor-choices.component.css'],
  standalone: false,
})
export class EditorChoicesComponent<T = string> {
  @Input({ required: true }) legend!: string;
  @Input({ required: true }) choices!: Choice<T>[];
  @Input() value: T | null = null;
  @Output() readonly pick = new EventEmitter<T>();

  get hasThumbs(): boolean {
    return this.choices.some((choice) => !!choice.thumb);
  }
}
