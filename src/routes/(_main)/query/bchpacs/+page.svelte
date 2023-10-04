<script>
	import { env } from '$env/dynamic/public';
</script>

<iframe
	class="h-[100vh] w-full"
	src={env.PUBLIC_BCHPACS_URL || ''}
	title="Query BCH PACS"
/>
