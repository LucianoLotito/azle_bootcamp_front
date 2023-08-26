export const idlFactory = ({ IDL }) => {
  const Poll = IDL.Record({
    'id' : IDL.Nat32,
    'is_open' : IDL.Bool,
    'title' : IDL.Text,
    'creator' : IDL.Principal,
    'participants' : IDL.Vec(IDL.Text),
    'approve' : IDL.Nat32,
    'description' : IDL.Text,
    'approved' : IDL.Bool,
    'decline' : IDL.Nat32,
  });
  const User = IDL.Record({ 'nickname' : IDL.Text, 'birth_date' : IDL.Text });
  return IDL.Service({
    'createPoll' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Principal, IDL.Nat64],
        [IDL.Opt(Poll)],
        [],
      ),
    'deleteUser' : IDL.Func([IDL.Principal], [IDL.Opt(User)], []),
    'getLivePolls' : IDL.Func([], [IDL.Vec(Poll)], ['query']),
    'getPoll' : IDL.Func([IDL.Nat32], [IDL.Opt(Poll)], ['query']),
    'getPolls' : IDL.Func([], [IDL.Vec(Poll)], ['query']),
    'getUser' : IDL.Func([IDL.Principal], [IDL.Opt(User)], ['query']),
    'setUser' : IDL.Func([IDL.Principal, User], [IDL.Opt(User)], []),
    'votePoll' : IDL.Func([IDL.Nat32, IDL.Text, IDL.Bool], [IDL.Opt(Poll)], []),
  });
};
export const init = ({ IDL }) => { return []; };
