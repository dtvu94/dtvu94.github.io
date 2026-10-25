import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { CARD_H, CARD_W, SLEEVE_H, SLEEVE_W } from '../geometry/shapes';

/**
 * The life of a suite on the detail page:
 * sealed → opened (flap up, card rising) → out (card in front of its
 * envelope) → unfolded (card drawn from its sleeve / jacket opened / band
 * slid off), and back again.
 */
export type SuiteState = 'sealed' | 'opened' | 'out' | 'unfolded';

/** Scene size in design pixels — everything is laid out inside it. */
export const SCENE_W = 640;
export const SCENE_H = 820;

/** How long each automatic step waits for the previous motion to finish. */
const RISE_MS = 1500;
const RETURN_MS = 950;
const REFOLD_MS = 1250;

/**
 * Composes a design's envelope and card (or pocket) into one scene.
 * Static in the gallery (envelope behind, card in front); interactive on the
 * detail page, where the card really comes out of the envelope: the layers
 * are siblings — back panel, card, front pocket, flap — so the card can pass
 * between them.
 */
@Component({
  selector: 'app-suite',
  templateUrl: './suite.component.html',
  styleUrls: ['./suite.component.css'],
  standalone: false,
})
export class SuiteComponent implements OnInit, OnDestroy {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input() interactive = false;

  readonly state = signal<SuiteState>('out');
  /** Direction of the last move — some delays differ going in vs. out. */
  readonly direction = signal<'in' | 'out'>('out');
  /** Card above the envelope's front pocket (z-order). */
  readonly front = signal(true);
  /** Set on the first interaction so reverse animations may run. */
  readonly touched = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];

  get isPocket(): boolean {
    return this.design.form === 'pocket' && !!this.design.pocket;
  }

  /** Whether the card has an inside to reveal (sleeve, jacket, band…). */
  get hasInside(): boolean {
    return this.isPocket;
  }

  get pieceWidth(): number {
    return this.isPocket && this.design.pocket?.variant === 'sleeve' ? SLEEVE_W : CARD_W;
  }

  get pieceHeight(): number {
    return this.isPocket && this.design.pocket?.variant === 'sleeve' ? SLEEVE_H : CARD_H;
  }

  ngOnInit(): void {
    if (this.interactive) {
      this.state.set('sealed');
      this.front.set(false);
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  /** Main action: advances to the next state. */
  advance(): void {
    switch (this.state()) {
      case 'sealed':
        this.open();
        break;
      case 'out':
        if (this.hasInside) {
          this.unfold();
        } else {
          this.close();
        }
        break;
      case 'unfolded':
        this.fold();
        break;
    }
  }

  open(): void {
    if (this.state() !== 'sealed') {
      return;
    }
    this.clearTimers();
    this.touched.set(true);
    this.direction.set('out');
    this.state.set('opened');
    this.later(RISE_MS, () => {
      this.front.set(true);
      this.state.set('out');
    });
  }

  unfold(): void {
    if (this.state() === 'out' && this.hasInside) {
      this.touched.set(true);
      this.state.set('unfolded');
    }
  }

  fold(): void {
    if (this.state() === 'unfolded') {
      this.state.set('out');
    }
  }

  /** Puts the card back and closes the flap (refolding first if needed). */
  close(): void {
    const state = this.state();
    if (state === 'sealed' || state === 'opened') {
      return;
    }
    this.clearTimers();
    this.touched.set(true);
    const stow = () => {
      this.direction.set('in');
      this.state.set('opened');
      this.later(RETURN_MS, () => {
        this.front.set(false);
        this.state.set('sealed');
      });
    };
    if (state === 'unfolded') {
      this.state.set('out');
      this.later(REFOLD_MS, stow);
    } else {
      stow();
    }
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
