<script lang="ts">
  import { EToastTypes } from "./../toast/toast-logic";
  import { onMount } from "svelte";
  import type { IQuickloginUser } from "./devconsole.types";
  import { LOCALDB } from "../localdb/localdb";
  import { toast } from "../toast/toast-logic";
  import Spinner from "../../elements/SpinnerRls.svelte";

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
      <option class="text-white" value={login}>{login.email}</option>
    {/each}
  </select>

  <!-- Login button -->

  <button
    disabled={isFetching_login}
    class="variant-filled-primary"
    on:click={async () => {
      isFetching_login = true;
      const result = await fetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: userToLogin.email,
          password: userToLogin.password,
        }),
      });

      isFetching_login = true;
      if (result.status === 200) {
        toast(`logged in as ${userToLogin.email}`, EToastTypes.SUCCESS);
        window.location.reload();
      } else {
        toast(`failed to log in`, EToastTypes.ERROR);
      }
    }}
  >
    {#if isFetching_login}
      <Spinner size="w-12" stroke={8} />
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
      const result = await fetch("/auth/logout", {
        method: "DELETE",
      });
      isFetching_logout = false;
      window.location.reload();
    }}
    >{#if isFetching_logout}
      <Spinner size="w-12" stroke={8} />
      <!-- content here -->
    {:else}
      Logout
    {/if}</button
  >
</div>
