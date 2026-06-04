import { Component, computed, inject } from '@angular/core';
import { WEDDING_UI } from '../data/ui-strings';
import { Lang } from '../data/wedding.types';
import { LanguageService } from '../language.service';

interface LangOption {
  code: Lang;
  label: string;
  flag: string;
  name: string;
}

/** Fixed top-right language switcher (vi / en / th). */
@Component({
  selector: 'app-language-toggle',
  templateUrl: './language-toggle.component.html',
  styleUrls: ['./language-toggle.component.css'],
  standalone: false,
})
export class LanguageToggleComponent {
  readonly language = inject(LanguageService);

  readonly options: LangOption[] = [
    { code: 'vi', label: 'VI', flag: '🇻🇳', name: 'Tiếng Việt' },
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
    { code: 'th', label: 'TH', flag: '🇹🇭', name: 'ภาษาไทย' },
  ];

  readonly groupLabel = computed(() => WEDDING_UI[this.language.lang()].langGroupLabel);
}
