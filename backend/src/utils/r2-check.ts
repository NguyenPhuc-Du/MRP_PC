import { listComponentObjects, r2PublicUrl } from "../config/r2";

async function main() {
  const keys = await listComponentObjects();
  console.log(`R2 OK — ${keys.length} file trong component/`);
  for (const key of keys.slice(0, 20)) {
    console.log(`- ${key}`);
    console.log(`  ${r2PublicUrl(key)}`);
  }
}

main().catch((error) => {
  console.error("R2 check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
