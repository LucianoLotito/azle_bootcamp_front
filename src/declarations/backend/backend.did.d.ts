import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Poll {
  'id' : number,
  'is_open' : boolean,
  'title' : string,
  'creator' : Principal,
  'participants' : Array<string>,
  'approve' : number,
  'description' : string,
  'approved' : boolean,
  'decline' : number,
}
export interface User { 'nickname' : string, 'birth_date' : string }
export interface _SERVICE {
  'createPoll' : ActorMethod<[string, string, Principal, bigint], [] | [Poll]>,
  'deleteUser' : ActorMethod<[Principal], [] | [User]>,
  'getLivePolls' : ActorMethod<[], Array<Poll>>,
  'getPoll' : ActorMethod<[number], [] | [Poll]>,
  'getPolls' : ActorMethod<[], Array<Poll>>,
  'getUser' : ActorMethod<[Principal], [] | [User]>,
  'setUser' : ActorMethod<[Principal, User], [] | [User]>,
  'votePoll' : ActorMethod<[number, string, boolean], [] | [Poll]>,
}
