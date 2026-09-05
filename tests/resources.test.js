import { describe, expect, it } from 'vitest';
import { validateResource } from '../src/lib/resourceValidation';
import { safeResourceUrl, toEmbedUrl } from '../src/lib/media';
describe('organisation and project resource validation', () => {
  const resource = { clientId: 'wolfgramm', projectId: 'film', externalUrl: 'https://example.com/film.mp4' };
  it('accepts the correct organisation', () => expect(validateResource(resource, { clientId: 'wolfgramm' })).toBe(resource));
  it('rejects another organisation project', () => expect(() => validateResource(resource, { clientId: 'cacao' })).toThrow(/organisation/));
  it('rejects missing and deleted projects', () => { expect(() => validateResource(resource, null)).toThrow(); expect(() => validateResource({ ...resource, projectId: '' }, { clientId: 'wolfgramm' })).toThrow(); });
  it('rejects executable resource and thumbnail URLs', () => { for (const field of ['url', 'externalUrl', 'thumbnailUrl']) expect(() => validateResource({ ...resource, [field]: 'javascript:alert(1)' }, { clientId: 'wolfgramm' })).toThrow(/HTTP/); });
  it('allows text testimonials without a URL', () => expect(validateResource({ clientId: 'wolfgramm', projectId: 'film', type: 'Testimonial' }, { clientId: 'wolfgramm' })).toBeTruthy());
});
describe('media URLs', () => {
  it('strips short YouTube query parameters from embed IDs', () => expect(toEmbedUrl('https://youtu.be/abc123?si=token')).toBe('https://www.youtube.com/embed/abc123'));
  it('supports Drive previews', () => expect(toEmbedUrl('https://drive.google.com/file/d/abc/view')).toBe('https://drive.google.com/file/d/abc/preview'));
  it('does not trust spoofed YouTube hosts', () => expect(toEmbedUrl('https://youtube.com.evil.test/watch?v=abc')).toBe('https://youtube.com.evil.test/watch?v=abc'));
  it('blocks script and data URLs and tolerates missing links', () => { for(const url of ['javascript:alert(1)', 'data:text/html,test', undefined]) expect(safeResourceUrl(url)).toBe(''); });
});
