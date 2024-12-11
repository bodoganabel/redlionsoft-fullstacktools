<script lang="ts">
  import { onMount } from "svelte";

  export let templatePaths: string[];

  let to = "testmail-to";
  let from = "testmail-from";
  let subject = "testmail-subject";

  onMount(() => {
    if (typeof window !== "undefined") {
      to = localStorage.getItem("testmail-to") || "";
      from = localStorage.getItem("testmail-from") || "";
      subject = localStorage.getItem("testmail-subject") || "";
    }
  });

  $: {
    if (typeof window !== "undefined") {
      localStorage.setItem("testmail-to", to);
      localStorage.setItem("testmail-from", from);
      localStorage.setItem("testmail-subject", subject);
    }
  }
</script>

<h4>Testmail</h4>
<hr />
<form>
  <div class="flex justify-center items-">
    <label class="m-0 p-0" for="to">To</label>
    <input
      class="input variant-outline-primary"
      type="email"
      id="to"
      bind:value={to}
    />
    <label class="m-0 p-0" for="from">From</label>
    <input
      class="input variant-outline-primary"
      type="email"
      id="from"
      bind:value={from}
    />
    <label class="m-0 p-0" for="subject">Subj</label>
    <input
      class="input variant-outline-primary"
      type="text"
      id="subject"
      bind:value={subject}
    />
  </div>
  <div class="mt-2">
    {#each templatePaths as templatePath}
      <button
        on:click={() => {
          fetch("/app/mail/test", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to,
              from,
              subject,
              path: templatePath,
            }),
          });
        }}
      >
        {templatePath}
      </button>
    {/each}
  </div>
</form>

<style>
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
  input {
    display: block;
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
  }
  button {
    display: block;
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: none;
    background-color: #4caf50;
    color: white;
    cursor: pointer;
  }
  button:hover {
    background-color: #45a049;
  }
</style>
