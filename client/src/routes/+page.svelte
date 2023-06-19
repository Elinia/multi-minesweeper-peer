<script lang="ts">
  import { goto } from '$app/navigation'

  let name = ''
</script>

<input bind:value={name} />
<button on:click={() => goto(`/u/${name}`)}>以 {name} 的身份登录</button>
