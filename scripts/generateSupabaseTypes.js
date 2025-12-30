import { exec } from "child_process";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
const projectId = process.env.NEXT_PUBLIC_SUPEBASE_PROJECT_ID;

if (!projectId) {
  console.error("❌ NEXT_PUBLIC_SUPEBASE_PROJECT_ID is not defined in .env");
  process.exit(1);
}

const command = `npx supabase gen types typescript --project-id ${projectId}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`⚠️ Stderr: ${stderr}`);
  }

  // Save to file
  import("fs").then((fs) => {
    fs.writeFileSync("src/integrations/supabase/types.ts", stdout);
    console.log(
      "✅ Types generated and saved to src/integrations/supabase/types.ts"
    );
  });
});
