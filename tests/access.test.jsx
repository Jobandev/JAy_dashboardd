import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
const state=vi.hoisted(() => ({ auth: { user: {uid:'jay'}, role:'administrator', clientId:null, loading:false }, listeners:[], stops:[] }));
vi.mock('../src/auth/AuthProvider', () => ({useAuth: () => state.auth}));
vi.mock('../src/firebase/firebase', () => ({isFirebaseConfigured:true}));
vi.mock('../src/firebase/portalService', () => {
  const subscribe=(...args)=>{state.listeners.push(args);const stop=vi.fn();state.stops.push(stop);return stop;};
  return {subscribeToCollection:subscribe,subscribeToClientScopedCollection:subscribe,subscribeToClientDoc:subscribe,seedPortalData:vi.fn().mockResolvedValue(),clearDemoData:vi.fn(),createClient:vi.fn(),updateClient:vi.fn(),deleteClient:vi.fn(),updateProject:vi.fn(),createContentLink:vi.fn(),updateContent:vi.fn(),createProject:vi.fn(),createActivity:vi.fn(),updateActivity:vi.fn(),deleteActivity:vi.fn(),deleteProject:vi.fn(),deleteContent:vi.fn(),resolveResourceFeedback:vi.fn(),deleteResourceFeedback:vi.fn()};
});
import { PortalDataProvider, usePortalData } from '../src/data/PortalDataProvider';
function Probe(){const {clients,projects,assets}=usePortalData();return <div data-testid="data">{JSON.stringify({clients,projects,assets})}</div>;}
beforeEach(()=>{state.listeners=[];state.stops=[];state.auth={user:{uid:'jay'},role:'administrator',clientId:null,loading:false};});
afterEach(cleanup);
it('clears admin data immediately when switching to a client and subscribes only to their organisation',async()=>{
 const {rerender}=render(<PortalDataProvider><Probe/></PortalDataProvider>);
 await act(async()=>{state.listeners[0][1]([{id:'cacao',name:'Private Cacao'}]);});
 expect(screen.getByTestId('data').textContent).toContain('Private Cacao');
 const oldStops=[...state.stops];state.listeners=[];
 state.auth={user:{uid:'client'},role:'client',clientId:'wolfgramm',loading:false};
 rerender(<PortalDataProvider><Probe/></PortalDataProvider>);
 expect(screen.getByTestId('data').textContent).not.toContain('Private Cacao');
 expect(oldStops.every(stop=>stop.mock.calls.length===1)).toBe(true);
 expect(state.listeners.length).toBe(3);
 expect(state.listeners[0][0]).toBe('wolfgramm');
 expect(state.listeners[1].slice(0,2)).toEqual(['projects','wolfgramm']);
 expect(state.listeners[2].slice(0,2)).toEqual(['assets','wolfgramm']);
});
it('unassigned clients subscribe to no organisation data',()=>{
 state.auth={user:{uid:'client'},role:'client',clientId:null,loading:false};
 render(<PortalDataProvider><Probe/></PortalDataProvider>);
 expect(state.listeners).toHaveLength(0);
 expect(screen.getByTestId('data').textContent).toBe(JSON.stringify({clients:[],projects:[],assets:[]}));
});
it('removes old resources when an organisation assignment changes in the same session',()=>{
 state.auth={user:{uid:'client'},role:'client',clientId:'wolfgramm',loading:false};
 const {rerender}=render(<PortalDataProvider><Probe/></PortalDataProvider>);
 act(()=>state.listeners[2][2]([{id:'film',title:'Wolfgramm private film'}]));
 expect(screen.getByTestId('data').textContent).toContain('Wolfgramm private film');
 state.auth={...state.auth,clientId:'cacao'};state.listeners=[];
 rerender(<PortalDataProvider><Probe/></PortalDataProvider>);
 expect(screen.getByTestId('data').textContent).not.toContain('Wolfgramm private film');
 expect(state.listeners[2].slice(0,2)).toEqual(['assets','cacao']);
});
