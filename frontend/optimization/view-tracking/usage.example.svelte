<script lang="ts">
  import { readable } from './readable';
</script>

<section use:readable={{ sectionId: 'hero' }}>
  <h1>Welcome</h1>
  <p>This is the hero section with some copy…</p>
</section>

<section use:readable={{ sectionId: 'features', minDwellMs: 3500 }}>
  <h2>Features</h2>
  <p>All about your product…</p>
</section>