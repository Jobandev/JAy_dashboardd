import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({getDocs:vi.fn(),remove:vi.fn(),update:vi.fn(),commit:vi.fn().mockResolvedValue(),set:vi.fn()}));
vi.mock('../src/firebase/firebase',()=>({db:{}}));
vi.mock('firebase/firestore',()=>({getDocs:mocks.getDocs,doc:(_db,name,id)=>({name,id}),collection:(_db,name)=>name,where:()=>({}),query:(name)=>name,writeBatch:()=>({delete:mocks.remove,update:mocks.update,commit:mocks.commit,set:mocks.set}),addDoc:vi.fn(),deleteDoc:vi.fn(),getDoc:vi.fn(),onSnapshot:vi.fn(),setDoc:vi.fn(),updateDoc:vi.fn(),serverTimestamp:vi.fn()}));
import {deleteClient,deleteProject} from '../src/firebase/portalService';
const snapshot=(...ids)=>({size:ids.length,docs:ids.map(id=>({ref:{id}}))});
beforeEach(()=>vi.clearAllMocks());
it('deletes a project and all queried resources in one commit',async()=>{
 mocks.getDocs.mockResolvedValueOnce(snapshot('video','document'));
 await deleteProject('film');expect(mocks.remove.mock.calls.map(([ref])=>ref.id)).toEqual(['video','document','film']);expect(mocks.commit).toHaveBeenCalledTimes(1);
});
it('deletes an organisation and its children while unassigning logins atomically',async()=>{
 mocks.getDocs.mockResolvedValueOnce(snapshot('film')).mockResolvedValueOnce(snapshot('video')).mockResolvedValueOnce(snapshot('client-login'));
 await deleteClient('wolf');expect(mocks.update).toHaveBeenCalledWith({id:'client-login'},{clientId:null});expect(mocks.remove.mock.calls.map(([ref])=>ref.id)).toEqual(['film','video','wolf']);expect(mocks.commit).toHaveBeenCalledTimes(1);
});
it('refuses oversized project deletion before any writes',async()=>{
 mocks.getDocs.mockResolvedValueOnce({size:450,docs:[]});await expect(deleteProject('large')).rejects.toThrow(/too large/);expect(mocks.remove).not.toHaveBeenCalled();expect(mocks.commit).not.toHaveBeenCalled();
});
it('does not start deleting when a dependent query fails',async()=>{
 mocks.getDocs.mockRejectedValueOnce(new Error('offline'));await expect(deleteProject('film')).rejects.toThrow('offline');expect(mocks.remove).not.toHaveBeenCalled();expect(mocks.commit).not.toHaveBeenCalled();
});
