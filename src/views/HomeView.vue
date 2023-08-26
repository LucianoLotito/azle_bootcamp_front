<script setup lang="ts">
import { AuthClient } from '@dfinity/auth-client';
import { Actor } from "@dfinity/agent";
import { backend } from "../declarations/backend/index.js";
import { onMounted, ref } from 'vue';
import { Principal } from "@dfinity/principal";
import type { Poll, User } from '@/declarations/backend/backend.did';

const authClient = ref<AuthClient>();
const authorized = ref(false);
const principal = ref<Principal | undefined>();
// const actor = ref(backend);
const userProfile = ref<User>();
const form = ref<User>({
  nickname: '',
  birth_date: ''
});

const pollForm = ref({
  title: '',
  description: '',
  creator: principal.value,
  service_time: 0,
  show_poll: false
});

const polls = ref<Poll[]>();
const loginPage = ref(true);
const isLocalNetwork = import.meta.env.VITE_DFX_NETWORK === 'local';
const identityProviderUrl = isLocalNetwork ?
  `http://127.0.0.1:4943/?canisterId=${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}` :
  'https://identity.ic0.app/';

const authenticate = async () => {
  if (authClient.value) {
    await authClient.value.login({
      identityProvider: identityProviderUrl,
      // 7 days in nanoseconds
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
      onSuccess: async () => {
        let identity = await authClient.value!.getIdentity();
        principal.value = identity.getPrincipal();

        await getProfile();
      },
      onError: () => {
        console.log("FAILED TO AUTHENTICATE");
      }
    });
  }
}

const logOut = () => {
  principal.value, backend, userProfile.value = undefined;
  authorized.value = false;
}

const register = async () => {
  if (principal.value && form.value) {
    let response = await backend.setUser(principal.value, form.value);
    authorized.value = true;
    userProfile.value = response[0];
  } else {
    error.value = 'Missing fields'
  }
}

const getProfile = async () => {
  if (principal.value) {
    let callProfile = await backend.getUser(principal.value);
    polls.value = await backend.getPolls();
    if (callProfile.length) {
      userProfile.value = callProfile[0];
      authorized.value = true;

    }
  }
}

const deleteProfile = async (): Promise<User | Error> => {
  let deletedUser: User[];
  if (principal.value) {
    deletedUser = await backend.deleteUser(principal.value);
    logOut();
    return deletedUser[0];
  }
  return new Error('Failed to delete user');
}

const vote = async (id: number, stand: boolean) => {
  if (principal.value)
    await backend.votePoll(id, principal.value.toString(), stand);
  polls.value = await backend.getPolls();
}

const createPoll = async () => {
  try {

    if (principal.value) {
      let serviceTime = BigInt(pollForm.value.service_time * 60 * 60);
      await backend.createPoll(pollForm.value.title, pollForm.value.description, principal.value, serviceTime);
      polls.value = await backend.getPolls();
    }
  } catch (error) {
    console.log("ERROR", error)
  }
}
const error = ref("");

const age = () => {
  if (userProfile.value) {
    let age = userProfile.value.birth_date.substring(0, 5);
    let currentDate = new Date().getFullYear()
    return currentDate - parseInt(age);
  }
  return '0000';
}

onMounted(async () => {
  authClient.value = await AuthClient.create({
    idleOptions: {
      idleTimeout: 1000 * 60 * 30, // set to 30 minutes
      disableDefaultIdleCallback: true // disable the default reload behavior
    }
  });
})
</script>

<template>
  <div>
    <img class="logo" src="../assets/motoko.png" alt="Motoko mascot">
    <div v-if="!authorized">
      <div v-if="loginPage">
        <el-button type="primary" @click="authenticate()">Authenticate</el-button>
        <p>Haven't registered yet? register</p><el-button type="primary" @click="loginPage = false">Register
          Now</el-button>
      </div>
      <div v-else>
        <el-button type="primary" @click="authenticate()">Authenticate</el-button>
        <el-form :model="form" label-width="120px">
          <el-form-item label="Nickname">
            <el-input v-model="form.nickname" />
          </el-form-item>
          <el-form-item label="Birth date">
            <el-date-picker format="YYYY/MM/DD" value-format="YYYY-MM-DD" v-model="form.birth_date" type="date"
              placeholder="Pick a date" style="width: 100%" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="register()">Create</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div v-else>
      <h2>Welcome back, {{ userProfile?.nickname }}</h2>
      today, you are {{ age() }} years old!
      <el-button type="warning" @click="logOut()">Log out</el-button>
      <el-button type="danger" @click="deleteProfile()">Delete profile</el-button>
      <el-button type="success" @click="pollForm.show_poll = true">Create a new poll</el-button>

      <el-form v-if="pollForm.show_poll">
        <el-form-item label="Title">
          <el-input v-model="pollForm.title" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="pollForm.description" />
        </el-form-item>
        <el-form-item label="Voting time (In hours)">
          <el-input v-model="pollForm.service_time" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createPoll()">Create Poll</el-button>
        </el-form-item>
      </el-form>
      <h2>Check out current polls</h2>
      <el-card class="box-card" v-for="poll in polls" style="margin-top: 10px;">
        <template #header>
          <div class="card-header">
            <span>{{ poll.is_open ? 'Open ' : 'Closed ' }}</span>
            <span>{{ poll.title }}</span>
            <div v-if="poll.is_open">
              <el-button @click="vote(poll.id, true)" style="float:right; margin-left: 4px"
                type="success">Approve</el-button>
              <el-button @click="vote(poll.id, false)" style="float:right" type="danger">Decline</el-button>
            </div>
          </div>
        </template>
        <div>
          <h3>Is the poll approved: {{ poll.approved }}</h3>
          <p>Description: {{ poll.description }}</p>
          <p class="Success">Approve votes: {{ poll.approve }}</p>
          <p class="Danger">Decline votes: {{ poll.decline }}</p>
          <p>Total votes {{ poll.decline + poll.approve }}</p>
        </div>
      </el-card>
    </div>
  </div>
</template>