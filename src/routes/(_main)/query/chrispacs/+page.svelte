<script>
	import { env } from '$env/dynamic/public';

</script>


<iframe
	class="h-[100vh] w-full"
	src={env.PUBLIC_CHRISPACS_URL || ""}
	title="Query ChRIS PACS"
/>
