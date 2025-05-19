import { Handler } from "aws-lambda";
import { exec } from "child_process";

export const handler: Handler = async (event, _) => {
  // Debug: List directories to check what's available
  await new Promise((resolve, _) => {
    console.log("--- Starting directory inspection ---");
    exec("ls -la /var/task/", (error, stdout, stderr) => {
      console.log("Base directory contents:");
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve(null);
    });
  });

  // Check prisma directory
  await new Promise((resolve, _) => {
    exec("ls -la /var/task/prisma/", (error, stdout, stderr) => {
      if (error) {
        console.log("Error listing prisma directory:", error.message);
      } else {
        console.log("Prisma directory contents:");
        console.log(stdout);
      }
      if (stderr) console.error(stderr);
      resolve(null);
    });
  });

  // Check prisma client directory
  await new Promise((resolve, _) => {
    exec("ls -la /var/task/prisma/client/", (error, stdout, stderr) => {
      if (error) {
        console.log("Error listing prisma client directory:", error.message);
      } else {
        console.log("Prisma client directory contents:");
        console.log(stdout);
      }
      if (stderr) console.error(stderr);
      resolve(null);
    });
  });

  console.log("--- End directory inspection ---");

  console.log("--- Inspect .env configuration ---");
  await new Promise((resolve, _) => {
    exec("cat /var/task/prisma/.env", (error, stdout, stderr) => {
      if (error) {
        console.log("Error reading .env file:", error.message);
      } else {
        console.log(".env file contents:");
        console.log(stdout);
      }
      if (stderr) console.error(stderr);
      resolve(null);
    });
  });
  console.log("--- End .env configuration ---");

  const command: string = event.command ?? "deploy";

  let options: string[] = [];

  if (command == "reset") {
    // skip confirmation and code generation
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
