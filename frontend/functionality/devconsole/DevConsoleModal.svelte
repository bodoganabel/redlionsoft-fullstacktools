<script lang="ts">
  import type { IQuickloginUser, TQuickActions } from "./devconsole.types";
    import QuickActions from "./modules/QuickActions.svelte";
  import Quicklogin from "./modules/Quicklogin.svelte";
  export let quickloginUsers: IQuickloginUser[];
  export let quickActions: TQuickActions[];
</script>

<Quicklogin {quickloginUsers} ></Quicklogin>
<QuickActions {quickActions}></QuickActions>

