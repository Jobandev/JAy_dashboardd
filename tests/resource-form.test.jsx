import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../src/auth/AuthProvider',()=>({useAuth:()=>({role:'administrator'})}));
vi.mock('../src/data/PortalDataProvider',()=>({usePortalData:()=>({addContentLink:vi.fn()})}));
import { AddContentLink } from '../src/pages/Content';
afterEach(cleanup);
it('only offers projects from the selected organisation and clears a stale project selection',()=>{
 render(<AddContentLink close={()=>{}} clients={[{id:'wolf',name:'Wolfgramm'},{id:'cacao',name:'Cacao'}]} projects={[{id:'film',name:'Wolf film',clientId:'wolf'},{id:'campaign',name:'Cacao campaign',clientId:'cacao'}]} defaultClientId="wolf"/>);
 expect(screen.getByRole('option',{name:'Wolf film'})).toBeTruthy();
 expect(screen.queryByRole('option',{name:'Cacao campaign'})).toBeNull();
 fireEvent.change(screen.getByLabelText('Project'),{target:{value:'film'}});
 fireEvent.change(screen.getByLabelText('Client'),{target:{value:'cacao'}});
 expect(screen.getByLabelText('Project').value).toBe('');
 expect(screen.queryByRole('option',{name:'Wolf film'})).toBeNull();
 expect(screen.getByRole('option',{name:'Cacao campaign'})).toBeTruthy();
});
