<script lang="ts">
  import type { IQuickloginUser } from "./devconsole.types";
  import Quicklogin from "./modules/Quicklogin.svelte";
  export let quickloginUsers: IQuickloginUser[];
  export let templatePaths: string[];
</script>

<Quicklogin {quickloginUsers}></Quicklogin>
