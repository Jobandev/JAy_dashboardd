import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../src/auth/AuthProvider', () => ({ useAuth: () => ({ role: 'client' }) }));
vi.mock('../src/data/PortalDataProvider', () => ({ usePortalData: () => ({}) }));
import { MediaViewer } from '../src/components/AssetCard';
afterEach(cleanup);
const asset = { title: 'Project film', type: 'Video', externalUrl: 'https://example.com/film.mp4' };
describe('resource viewer', () => {
  it('has a visible close control, keyboard exit and backdrop exit', () => {
    const close=vi.fn(); render(<MediaViewer asset={asset} close={close}/>);
    const button=screen.getByRole('button', {name:'Close viewer'});
    expect(button.textContent).toContain('Close'); expect(document.activeElement).toBe(button);
    fireEvent.click(button); fireEvent.keyDown(document, {key:'Escape'});
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement);
    expect(close).toHaveBeenCalledTimes(3);
    fireEvent.mouseDown(screen.getByRole('dialog')); expect(close).toHaveBeenCalledTimes(3);
  });
  it('preserves the video element when paused and restores focus on exit', () => {
    const launcher=document.createElement('button'); document.body.append(launcher); launcher.focus();
    const {unmount}=render(<MediaViewer asset={asset} close={()=>{}}/>);
    const video=document.querySelector('video'); fireEvent.pause(video); expect(document.querySelector('video')).toBe(video);
    unmount(); expect(document.activeElement).toBe(launcher); expect(document.body.style.overflow).toBe(''); launcher.remove();
  });
  it('renders images and text testimonials appropriately', () => {
    const {unmount}=render(<MediaViewer asset={{...asset,type:'Image'}} close={()=>{}}/>);
    expect(screen.getByRole('img').getAttribute('alt')).toBe(asset.title); unmount();
    render(<MediaViewer asset={{title:'Feedback',type:'Testimonial',quoteText:'Great result',quoteAuthor:'Client'}} close={()=>{}}/>);
    expect(screen.getByText('Great result')).toBeTruthy(); expect(document.querySelector('iframe')).toBeNull();
  });
});
