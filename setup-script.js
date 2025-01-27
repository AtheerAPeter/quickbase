#!/usr/bin/env node

const readline = require("readline");
const yargs = require("yargs");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

const askQuestion = (rl, question) =>
  new Promise((resolve) => rl.question(question, resolve));

const getProjectName = async () => {
  const projectName = yargs.argv.name;
  if (projectName) return projectName;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const name = await askQuestion(
    rl,
    "Enter project name (default: awesome-backend): "
  );
  rl.close();
  return name || "awesome-backend";
};

const packageManagers = ["npm", "yarn", "pnpm", "bun"];

const getPackageManager = () => {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    console.log("Select package manager (use arrow keys):");
    const render = () => {
      console.clear();
      console.log("Select package manager (use arrow keys):");
      packageManagers.forEach((pm, i) => {
        console.log(`${i === selectedIndex ? ">" : " "} ${pm}`);
      });
    };

    render();

    process.stdin.on("data", (key) => {
      const byte = key[0];

      if (byte === 3) {
        process.exit();
      }

      if (byte === 13) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        rl.close();
        resolve(packageManagers[selectedIndex]);
        return;
      }

      if (byte === 27 && key[1] === 91) {
        // Arrow keys
        if (key[2] === 65) {
          // Up
          selectedIndex =
            selectedIndex > 0 ? selectedIndex - 1 : packageManagers.length - 1;
        }
        if (key[2] === 66) {
          // Down
          selectedIndex =
            selectedIndex < packageManagers.length - 1 ? selectedIndex + 1 : 0;
        }
        render();
      }
    });
  });
};

const databaseOptions = ["postgresql", "sqlite"];

const getDatabase = () => {
  return new Promise((resolve) => {
    let selectedIndex = 0;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    console.log("Select database (use arrow keys):");
    const render = () => {
      console.clear();
      console.log("Select database (use arrow keys):");
      databaseOptions.forEach((pm, i) => {
        console.log(`${i === selectedIndex ? ">" : " "} ${pm}`);
      });
    };

    render();

    process.stdin.on("data", (key) => {
      const byte = key[0];

      if (byte === 3) {
        process.exit();
      }

      if (byte === 13) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        rl.close();
        resolve(databaseOptions[selectedIndex]);
        return;
      }

      if (byte === 27 && key[1] === 91) {
        // Arrow keys
        if (key[2] === 65) {
          // Up
          selectedIndex =
            selectedIndex > 0 ? selectedIndex - 1 : databaseOptions.length - 1;
        }
        if (key[2] === 66) {
          // Down
          selectedIndex =
            selectedIndex < databaseOptions.length - 1 ? selectedIndex + 1 : 0;
        }
        render();
      }
    });
  });
};

const execCommand = (command, options = {}) => {
  try {
    return execSync(command, { ...options, encoding: "utf8" });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
};

const getLatestVersion = (packageName) => {
  try {
    const version = execCommand(`npm view ${packageName} version`, {
      stdio: null,
    }).trim();
    return `^${version}`;
  } catch (error) {
    console.error(`Error fetching version for ${packageName}:`, error);
    process.exit(1);
  }
};

const createProjectStructure = async (projectName) => {
  const projectPath = path.join(process.cwd(), projectName);
  const packageManager = await getPackageManager();
  const database = await getDatabase();

  // Create project directory
  fs.mkdirSync(projectPath);
  process.chdir(projectPath);

  // Initialize package.json
  execCommand(`${packageManager} init -y`);

  // Get latest versions of all dependencies
  console.log(chalk.blue("Fetching latest package versions..."));

  const dependencies = {
    "@hono/node-server": getLatestVersion("@hono/node-server"),
    "@prisma/client": getLatestVersion("@prisma/client"),
    bcrypt: getLatestVersion("bcrypt"),
    dotenv: getLatestVersion("dotenv"),
    hono: getLatestVersion("hono"),
    zod: getLatestVersion("zod"),
  };

  const devDependencies = {
    "@types/bcrypt": getLatestVersion("@types/bcrypt"),
    "@types/node": getLatestVersion("@types/node"),
    prisma: getLatestVersion("prisma"),
    tsx: getLatestVersion("tsx"),
    typescript: getLatestVersion("typescript"),
  };

  // Update package.json
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    main: "index.js",
    type: "module",
    scripts: {
      dev: "tsx watch src/index.ts",
      start: "npx tsx src/index.ts",
      "prisma:generate": "prisma generate",
      "prisma:migrate": "prisma migrate dev",
      "prisma:studio": "prisma studio",
    },
    keywords: [],
    author: "",
    license: "ISC",
    description: "",
    dependencies,
    devDependencies,
  };

  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

  // Install dependencies
  console.log(chalk.blue("Installing dependencies..."));
  execCommand(`${packageManager} install`, { stdio: "inherit" });

  // Initialize TypeScript
  console.log(chalk.blue("Setting up TypeScript..."));
  fs.writeFileSync(
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          module: "ESNext",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: true,
          outDir: "dist",
          rootDir: "src",
        },
        include: ["src/**/*"],
      },
      null,
      2
    )
  );

  // Create project structure
  fs.mkdirSync("src");
  fs.mkdirSync("src/controllers");
  fs.mkdirSync("src/middleware");
  fs.mkdirSync("src/routes");
  fs.mkdirSync("src/tools");
  fs.mkdirSync("prisma");

  // Create basic files
  fs.writeFileSync(
    ".env",
    database === "postgresql"
      ? `DATABASE_URL="postgresql://mydb:@localhost:5432/mydb?schema=public"
      JWT_SECRET="SomeRandomString" `
      : `DATABASE_URL="file:./dev.db"
      JWT_SECRET="SomeRandomString"`
  );

  fs.writeFileSync(
    ".gitignore",
    `node_modules
.env
dist
.DS_Store`
  );

  // Create Prisma schema
  fs.writeFileSync(
    "prisma/schema.prisma",
    `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${database}"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`
  );

  // Create main application file
  fs.writeFileSync(
    "src/index.ts",
    `import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import v1 from "./routes/v1.js";

export const prisma = new PrismaClient();
const app = new Hono();

app.use("*", cors());

async function main() {
  app.route("/v1", v1);
}
main();

const port = process.env.PORT || 4000;
console.log(\`Server is running: http://localhost:\${port}\`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
`
  );

  // Create routes file
  fs.writeFileSync(
    "src/routes/v1.ts",
    `import { Hono } from "hono";
import { UserController } from "../controllers/user.controller";
import { userAuth } from "../middleware/userAuth";
import { PostController } from "../controllers/post.controller";

const v1 = new Hono();

// User routes
v1.post("/users/register", UserController.register);
v1.post("/users/login", UserController.login);

// Post routes
v1.post("/posts", userAuth, PostController.create);
v1.get("/posts", userAuth, PostController.index);
v1.get("/posts/:id", userAuth, PostController.show);

export default v1;
`
  );

  // Create controllers
  fs.writeFileSync(
    "src/controllers/user.controller.ts",
    `import { Context } from "hono";
import { z } from "zod";
import {
  comparePassword,
  hashPassword,
  resData,
  resError,
} from "../tools/utils";
import { sign } from "hono/jwt";
import { prisma } from "..";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class UserController {
  static async register(c: Context) {
    try {
      const body = await c.req.json();

      const result = registerSchema.safeParse(body);
      if (!result.success) {
        return resError(c, { error: result.error });
      }

      const userFound = await prisma.user.findUnique({
        where: { email: result.data.email },
      });

      if (userFound) {
        return resError(c, { error: "User already exists" });
      }
      const hashedPassword = await hashPassword(result.data.password);

      const user = await prisma.user.create({
        data: { ...result.data, password: hashedPassword },
        omit: { password: true },
      });

      const token = await sign(
        { id: user.id },
        process.env.JWT_SECRET as string
      );

      return resData(c, { user, token });
    } catch (error) {
      console.log(error);
      return resError(c, { error: "Internal server error" }, 500);
    }
  }

  static async login(c: Context) {
    try {
      const body = await c.req.json();

      const result = loginSchema.safeParse(body);
      if (!result.success) {
        return resError(c, { error: result.error });
      }

      const user = await prisma.user.findUnique({
        where: { email: result.data.email },
      });

      if (!user) {
        return resError(c, { error: "User not found" });
      }

      const isPasswordValid = await comparePassword(
        result.data.password,
        user.password
      );

      if (!isPasswordValid) {
        return resError(c, { error: "Invalid credentials" });
      }

      const token = await sign(
        { id: user.id },
        process.env.JWT_SECRET as string
      );

      return resData(c, { user: { ...user, password: "" }, token });
    } catch (error) {
      console.log(error);
      return resError(c, { error: "Internal server error" }, 500);
    }
  }
}
`
  );

  fs.writeFileSync(
    "src/controllers/post.controller.ts",
    `import { Context } from "hono";
import { z } from "zod";
import { resData, resError } from "../tools/utils";
import { prisma } from "..";

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export class PostController {
  static async create(c: Context) {
    try {
      const body = await c.req.json();
      const user = c.get("user");

      const result = createPostSchema.safeParse(body);
      if (!result.success) {
        return resError(c, { error: result.error });
      }

      const post = await prisma.post.create({
        data: { ...result.data, author: { connect: { id: user.id } } },
      });

      return resData(c, { post });
    } catch (error) {
      console.log(error);
      return resError(c, { error: "Internal server error" }, 500);
    }
  }

  static async index(c: Context) {
    const user = c.get("user");
    const page = Number(c.req.query("p")) || 1;
    const size = Number(c.req.query("s")) || 10;
    const skip = (page - 1) * size;

    try {
      const posts = await prisma.post.findMany({
        where: { authorId: user.id },
        take: size,
        skip,
      });

      return resData(c, posts);
    } catch (error) {
      console.log(error);
      return resError(c, { error: "Internal server error" }, 500);
    }
  }

  static async show(c: Context) {
    try {
      const id = c.req.param("id");

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            omit: { password: true },
          },
        },
      });

      if (!post) {
        return resError(c, { error: "Post not found" });
      }

      return resData(c, post);
    } catch (error) {
      console.log(error);
      return resError(c, { error: "Internal server error" }, 500);
    }
  }
}
`
  );

  // Create utils file
  fs.writeFileSync(
    "src/tools/utils.ts",
    `import * as bcrypt from "bcrypt";
import { Context } from "hono";
import { StatusCode } from "hono/utils/http-status";

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

const resData = (c: Context, data: any, status: StatusCode = 200) => {
  c.status(status);
  return c.json(data);
};

const resError = (c: Context, data: any, status: StatusCode = 400) => {
  c.status(status);
  return c.json(data);
};

export { hashPassword, comparePassword, resData, resError };
`
  );

  // Creating middleware
  fs.writeFileSync(
    "src/middleware/userAuth.ts",
    `import { verify } from "hono/jwt";
import type { Next } from "hono";
import type { Context } from "hono";
import { prisma } from "..";

export const userAuth = async (c: Context, next: Next) => {
  try {
    const token = c.req.header("token");

    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const payload = await verify(token, process.env.JWT_SECRET as string);

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    c.set("user", user);

    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
};
`
  );

  console.log(chalk.green(`\nProject ${projectName} created successfully!`));
  console.log(chalk.blue("\nNext steps:"));
  console.log("1. cd", projectName);
  console.log(`2. ${packageManager} run prisma:generate`);
  console.log(`3. ${packageManager} run prisma:migrate`);
  console.log(`4. ${packageManager} run dev`);
};

const main = async () => {
  const projectName = await getProjectName();
  await createProjectStructure(projectName);
};

main().catch((error) => {
  console.error(chalk.red("Error:"), error);
  process.exit(1);
});
