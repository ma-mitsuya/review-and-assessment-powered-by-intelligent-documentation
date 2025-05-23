import { Handler } from "aws-lambda";
import { exec } from "child_process";
import { getDatabaseUrl } from "../utils/database";

export const handler: Handler = async (event, _) => {
  // DATABASE_URLを環境変数に設定（マイグレーション実行前に必要）
  process.env.DATABASE_URL = await getDatabaseUrl();

  const command: string = event.command ?? "deploy";
  let options: string[] = [];

  if (command == "reset") {
    options = ["--force", "--skip-generate"];
  }

  try {
    const exitCode = await new Promise((resolve, _) => {
      exec(
        `npx prisma migrate ${command} ${options.join(" ")}`,
        (error, stdout, stderr) => {
          console.log(stdout);
          if (stderr) console.error(stderr);
          if (error != null) {
            console.log(
              `npx prisma migrate ${command} exited with error ${error.message}`
            );
            resolve(error.code ?? 1);
          } else {
            resolve(0);
          }
        }
      );
    });

    if (exitCode != 0)
      throw Error(`command ${command} failed with exit code ${exitCode}`);
  } catch (e) {
    console.log(e);
    throw e;
  }
};
