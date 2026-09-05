import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mock=vi.hoisted(()=>({remove:vi.fn().mockResolvedValue()}));
vi.mock('../src/firebase/clientAccounts',()=>({createClientAccount:vi.fn(),assignClientAccount:vi.fn(),removeClientAccess:mock.remove}));
vi.mock('../src/data/PortalDataProvider',()=>({usePortalData:()=>({clients:[{id:'wolf',name:'Wolfgramm'}],users:[{id:'contact',role:'client',email:'test@example.com',clientId:'wolf'},{id:'archived',role:'client',email:'removed@example.com',archived:true}]})}));
import { ClientAccounts } from '../src/components/ClientAccounts';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.clearAllMocks();});
it('requires confirmation before removing portal access and hides archived accounts',async()=>{
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
 render(<ClientAccounts/>);
 expect(screen.queryByText('removed@example.com')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Delete access'}));
 expect(mock.remove).not.toHaveBeenCalled();
 confirm.mockReturnValue(true);
 fireEvent.click(screen.getByRole('button',{name:'Delete access'}));
 await waitFor(()=>expect(mock.remove).toHaveBeenCalledWith('contact'));
 expect(confirm.mock.calls[1][0]).toContain('Firebase login and organisation data will remain');
});
