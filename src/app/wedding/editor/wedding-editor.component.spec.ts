import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule, convertToParamMap } from '@angular/router';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { EDITOR_DECLARATIONS, SUITE_DECLARATIONS } from '../wedding.declarations';
import { EDITOR_STORAGE_KEY, EditorState } from './editor-state';
import { WeddingEditorComponent } from './wedding-editor.component';

describe('WeddingEditorComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function setup(query: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      declarations: [LanguageToggleComponent, ...SUITE_DECLARATIONS, ...EDITOR_DECLARATIONS],
      imports: [RouterModule.forRoot([])],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } }],
    });
    const fixture = TestBed.createComponent(WeddingEditorComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const click = (selector: string, text?: string) => {
      const el = Array.from(root.querySelectorAll<HTMLElement>(selector)).find((e) => !text || e.textContent?.includes(text));
      expect(el).toBeTruthy();
      el!.click();
      fixture.detectChanges();
    };
    return { fixture, root, click, component: fixture.componentInstance };
  }

  const saved = () => JSON.parse(localStorage.getItem(EDITOR_STORAGE_KEY) ?? 'null') as EditorState | null;

  it('edits a paper suite piece by piece: envelope, invitation, directions, content', () => {
    const { root, click } = setup();
    const tabs = () => Array.from(root.querySelectorAll('.ed__tab')).map((t) => t.textContent?.trim());
    expect(tabs()).toEqual(['Bao thư', 'Thiệp mời', 'Đường đi', 'Nội dung']);
    expect(root.querySelector('.ed__stage-title')?.textContent).toContain('Bao thư · mặt trước');
    expect(root.querySelector('app-editor-stage app-envelope .env__hn-names')).toBeTruthy();

    // A label choice re-draws the envelope front.
    click('.ch__item', 'Logo + tên');
    expect(root.querySelector('app-editor-stage .env__logo .vt-logo')).toBeTruthy();
    expect(root.querySelector('app-editor-stage .env__names')?.textContent).toContain('Tuấn Vũ');

    // Square envelope: the body, flap and flat-lay piece follow.
    click('.ch__item', 'Vuông');
    const env = root.querySelector('app-editor-stage app-envelope') as HTMLElement;
    expect([env.style.width, env.style.height]).toEqual(['400px', '400px']);

    click('.ed__tab', 'Thiệp mời');
    click('.ch__item', 'Khung vòm');
    expect(root.querySelector('app-editor-stage .inv')?.className).toContain('inv--archFrame');

    click('.ed__tab', 'Đường đi');
    click('.ch__item', 'Viền đôi');
    expect(root.querySelector('app-editor-stage .dc')?.className).toContain('dc--frame-double');

    click('.ed__tab', 'Nội dung');
    const groom = root.querySelector<HTMLInputElement>('.ed__field input')!;
    groom.value = 'Minh Khoa';
    groom.dispatchEvent(new Event('input'));
    click('.ed__tab', 'Thiệp mời');
    expect(root.querySelector('app-editor-stage .inv__couple')?.textContent).toContain('Minh Khoa');
  });

  it('online has no envelope; the overview shows the online card and the directions', () => {
    const { root, click } = setup();
    click('.ed__mode', 'Thiệp online');
    expect(Array.from(root.querySelectorAll('.ed__tab')).map((t) => t.textContent?.trim())).not.toContain('Bao thư');
    click('.ed__overview-btn');
    expect(root.querySelector('.ed__overview app-online-card')).toBeTruthy();
    expect(root.querySelector('.ed__overview app-envelope')).toBeNull();
    expect(root.querySelector('.ed__overview app-directions-card')).toBeTruthy();
  });

  it('adds stickers from the tray, edits and removes them, and keeps them in localStorage', () => {
    const { fixture, root, click, component } = setup();
    click('.ed__tray-item', 'Trái tim');
    expect(root.querySelectorAll('app-editor-stage .stage__sticker')).toHaveLength(1);
    const sticker = component.state().stickers[0];
    expect(sticker).toEqual(expect.objectContaining({ face: 'envelopeFront', kind: 'heart', x: 0.5, y: 0.5 }));

    click('.ed__btn', 'Nhân bản');
    expect(component.state().stickers).toHaveLength(2);
    click('.ed__btn', 'Xóa');
    expect(component.state().stickers).toHaveLength(1);

    // The back of the envelope has its own stickers.
    click('.ed__face', 'Mặt sau');
    expect(root.querySelectorAll('app-editor-stage .stage__sticker')).toHaveLength(0);

    fixture.destroy();
    expect(saved()?.stickers).toHaveLength(1);
  });

  it('starts from the design in ?from= and asks twice before starting over', () => {
    const { root, click, component } = setup({ from: 'vn-luc-binh' });
    expect(component.state().from).toBe('vn-luc-binh');
    expect(component.state().tab).toBe('card');
    expect(root.querySelector('app-editor-stage .inv')?.className).toContain('inv--laserCloud');

    click('.ed__btn', 'Làm lại từ đầu');
    expect(component.state().from).toBe('vn-luc-binh');
    click('.ed__btn', 'Bấm lần nữa');
    expect(component.state().from).toBe('press-red-foil');
  });
});
