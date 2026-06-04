import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('defaults to Vietnamese', () => {
    expect(new LanguageService().lang()).toBe('vi');
  });

  it('switches language and persists the choice', () => {
    const service = new LanguageService();
    service.setLang('th');

    expect(service.lang()).toBe('th');
    expect(localStorage.getItem('wedding-lang')).toBe('th');
    // A fresh service (next visit) restores the stored language.
    expect(new LanguageService().lang()).toBe('th');
  });

  it('falls back to Vietnamese for unknown stored values', () => {
    localStorage.setItem('wedding-lang', 'xx');
    expect(new LanguageService().lang()).toBe('vi');
  });
});
