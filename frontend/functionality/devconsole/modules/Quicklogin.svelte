<script lang="ts">
  import { toast } from "../../toast/toast-logic";
  import Spinner from "../../../elements/SpinnerRls.svelte";
  import { EToastTypes } from "./../../toast/toast-logic";
  import { onMount } from "svelte";
  import type { IQuickloginUser } from "./../devconsole.types";
  import { LOCALDB } from "../../localdb/localdb";
  import { apiRequest } from "../../../client/api-request";

  export let quickloginUsers: IQuickloginUser[];

  const LAST_QUICKLOGIN_USER_KEY = "LAST_QUICKLOGIN_USER_KEY";

  console.log("quickloginUsers:");
  console.log(quickloginUsers);

  let userToLogin: IQuickloginUser;
  let isFetching_login = false;
  let isFetching_logout = false;

  onMount(() => {
    userToLogin = LOCALDB.get(LAST_QUICKLOGIN_USER_KEY, quickloginUsers[0]);

    console.log("userToLogIn:");
    console.log(userToLogin);
  });
</script>

<div class="w-full flex justify-start items-center space-x-1">
  <label for="autologin">Quicklogin: </label>
  <select
    name="autologin"
    class="select"
    bind:value={userToLogin}
    on:change={() => {
      LOCALDB.set(LAST_QUICKLOGIN_USER_KEY, userToLogin);
    }}
  >
    {#each quickloginUsers as login}
      <option class="text-white" value={login}
        >{login.email}{login.note ? login.note : ""}</option
      >
    {/each}
  </select>

  <!-- Login button -->

  <button
    disabled={isFetching_login}
    class="variant-filled-primary"
    on:click={async () => {
      isFetching_login = true;
      const { data, error } = await apiRequest({
        url: "/auth/login",
        method: "POST",
        body: {
          email: userToLogin.email,
          password: userToLogin.password,
        },
      });

      isFetching_login = false;
      if (data) {
        toast(`logged in as ${userToLogin.email}`, EToastTypes.SUCCESS);
        window.location.reload();
      } else {
        toast(error?.message || `failed to log in`, EToastTypes.ERROR);
      }
    }}
  >
    {#if isFetching_login}
      <Spinner size="w-12" stroke={10} />
      <!-- content here -->
    {:else}
      Log in
    {/if}
  </button>

  <button
    disabled={isFetching_logout}
    class="variant-outline-secondary"
    on:click={async () => {
      isFetching_logout = true;
      const { data, error } = await apiRequest({
        url: "/auth/logout",
        method: "DELETE",
      });

      isFetching_logout = false;
      if (data) {
        window.location.reload();
      } else {
        toast(error?.message || `failed to logout`, EToastTypes.ERROR);
      }
    }}
    >{#if isFetching_logout}
      <Spinner size="w-12" stroke={10} />
      <!-- content here -->
    {:else}
      Logout
    {/if}</button
  >
</div>
