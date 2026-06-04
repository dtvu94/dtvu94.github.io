import { Injectable, signal } from '@angular/core';
import { Lang } from './data/wedding.types';

const STORAGE_KEY = 'wedding-lang';
const LANGS: readonly Lang[] = ['vi', 'en', 'th'];

/**
 * Hand-rolled language state for the wedding pages — a signal plus
 * localStorage persistence. Vietnamese is the default. No i18n library.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly current = signal<Lang>(restoreLang());

  /** The active language as a read-only signal. */
  readonly lang = this.current.asReadonly();

  setLang(lang: Lang): void {
    this.current.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable (private mode) — language still switches for the session.
    }
  }
}

function restoreLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(stored as Lang) ? (stored as Lang) : 'vi';
  } catch {
    return 'vi';
  }
}
