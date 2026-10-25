import { AfterViewInit, Component, ElementRef, HostBinding, Input, OnDestroy, inject } from '@angular/core';

/**
 * Shows fixed-size design art (e.g. a 640 × 820 suite scene) at whatever
 * width the layout gives it: the host keeps the art's aspect ratio and a
 * ResizeObserver writes the scale to `--s` directly on the element — no
 * change detection involved, so dozens of gallery tiles stay cheap.
 */
@Component({
  selector: 'app-scene-frame',
  template: `<div class="frame__inner" [style.width.px]="w" [style.height.px]="h"><ng-content /></div>`,
  styles: [
    ':host { display: block; position: relative; width: 100%; }',
    '.frame__inner { position: absolute; left: 0; top: 0; transform-origin: 0 0; transform: scale(var(--s, 1)); }',
  ],
  standalone: false,
})
export class SceneFrameComponent implements AfterViewInit, OnDestroy {
  @Input() w = 640;
  @Input() h = 820;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: ResizeObserver;

  @HostBinding('style.aspect-ratio')
  get aspect(): string {
    return `${this.w} / ${this.h}`;
  }

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    const update = () => {
      const width = el.clientWidth;
      if (width > 0) {
        el.style.setProperty('--s', String(width / this.w));
      }
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(update);
      this.observer.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
