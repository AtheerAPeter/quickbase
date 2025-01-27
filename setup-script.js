#!/usr/bin/env node
let readline = require("readline"),
  yargs = require("yargs"),
  execSync = require("child_process").execSync,
  fs = require("fs-extra"),
  path = require("path"),
  chalk = require("chalk"),
  askQuestion = (e, s) => new Promise((r) => e.question(s, r)),
  getProjectName = async () => {
    var r,
      e = yargs.argv.name;
    return (
      e ||
      ((e = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })),
      (r = await askQuestion(
        e,
        "Enter project name (default: awesome-backend): "
      )),
      e.close(),
      r) ||
      "awesome-backend"
    );
  },
  packageManagers = ["npm", "yarn", "pnpm", "bun"],
  getPackageManager = () =>
    new Promise((s) => {
      let t = 0,
        o = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        }),
        a =
          (process.stdin.setRawMode(!0),
          process.stdin.resume(),
          console.log(
            chalk.cyan.bold(
              "\nSelect package manager (use ↑↓ arrows, press enter to confirm):"
            )
          ),
          () => {
            console.clear(),
              console.log(
                chalk.cyan.bold(
                  "\nSelect package manager (use ↑↓ arrows, press enter to confirm):"
                )
              ),
              packageManagers.forEach((r, e) => {
                e === t
                  ? console.log(chalk.green.bold("> " + r))
                  : console.log(chalk.white("  " + r));
              });
          });
      a(),
        process.stdin.on("data", (r) => {
          var e = r[0];
          3 === e && process.exit(),
            13 === e
              ? (process.stdin.setRawMode(!1),
                process.stdin.pause(),
                o.close(),
                s(packageManagers[t]))
              : 27 === e &&
                91 === r[1] &&
                (65 === r[2] &&
                  (t = 0 < t ? t - 1 : packageManagers.length - 1),
                66 === r[2] && (t = t < packageManagers.length - 1 ? t + 1 : 0),
                a());
        });
    }),
  databaseOptions = ["postgresql", "sqlite"],
  getDatabase = () =>
    new Promise((s) => {
      let t = 0,
        o = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        }),
        a =
          (process.stdin.setRawMode(!0),
          process.stdin.resume(),
          console.log(
            chalk.cyan.bold(
              "\nSelect database (use ↑↓ arrows, press enter to confirm):"
            )
          ),
          () => {
            console.clear(),
              console.log(
                chalk.cyan.bold(
                  "\nSelect database (use ↑↓ arrows, press enter to confirm):"
                )
              ),
              databaseOptions.forEach((r, e) => {
                e === t
                  ? console.log(chalk.green.bold("> " + r))
                  : console.log(chalk.white("  " + r));
              });
          });
      a(),
        process.stdin.on("data", (r) => {
          var e = r[0];
          3 === e && process.exit(),
            13 === e
              ? (process.stdin.setRawMode(!1),
                process.stdin.pause(),
                o.close(),
                s(databaseOptions[t]))
              : 27 === e &&
                91 === r[1] &&
                (65 === r[2] &&
                  (t = 0 < t ? t - 1 : databaseOptions.length - 1),
                66 === r[2] && (t = t < databaseOptions.length - 1 ? t + 1 : 0),
                a());
        });
    }),
  execCommand = (e, r = {}) => {
    try {
      return execSync(e, { ...r, encoding: "utf8" });
    } catch (r) {
      console.error("Error executing command: " + e), process.exit(1);
    }
  },
  initScripts = {
    npm: "npm init -y",
    yarn: "yarn init -y",
    pnpm: "pnpm init",
    bun: "bun init -y",
  },
  createProjectStructure = async (r) => {
    var e = path.join(process.cwd(), r),
      s = await getPackageManager(),
      t = await getDatabase(),
      e =
        (fs.mkdirSync(e),
        process.chdir(e),
        execCommand(initScripts[s]),
        {
          name: r,
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
        }),
      e =
        (fs.writeFileSync("package.json", JSON.stringify(e, null, 2)),
        console.log(chalk.blue("Installing dependencies...")),
        execCommand(
          s +
            " add " +
            [
              "@hono/node-server",
              "@prisma/client",
              "bcrypt",
              "dotenv",
              "hono",
              "zod",
            ].join(" ")
        ),
        console.log(chalk.blue("Installing dev dependencies...")),
        "npm" === s ? "--save-dev" : "-D");
    execCommand(
      s +
        ` add ${e} ` +
        ["@types/bcrypt", "@types/node", "prisma", "tsx", "typescript"].join(
          " "
        )
    ),
      console.log(chalk.blue("Setting up TypeScript...")),
      fs.writeFileSync(
        "tsconfig.json",
        JSON.stringify(
          {
            compilerOptions: {
              target: "ES2020",
              module: "ESNext",
              moduleResolution: "node",
              esModuleInterop: !0,
              strict: !0,
              outDir: "dist",
              rootDir: "src",
            },
            include: ["src/**/*"],
          },
          null,
          2
        )
      ),
      fs.mkdirSync("src"),
      fs.mkdirSync("src/controllers"),
      fs.mkdirSync("src/middleware"),
      fs.mkdirSync("src/routes"),
      fs.mkdirSync("src/tools"),
      fs.mkdirSync("prisma"),
      fs.writeFileSync(
        ".env",
        "postgresql" === t
          ? `DATABASE_URL="postgresql://mydb:@localhost:5432/mydb?schema=public"
  JWT_SECRET="SomeRandomString" `
          : `DATABASE_URL="file:./dev.db"
  JWT_SECRET="SomeRandomString"`
      ),
      fs.writeFileSync(
        ".gitignore",
        `node_modules
.env
dist
.DS_Store`
      ),
      fs.writeFileSync(
        "prisma/schema.prisma",
        `generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "${t}"
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
      ),
      fs.writeFileSync(
        "src/index.ts",
        `import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import v1 from "./routes/v1.js";

export const prisma = new PrismaClient();
const app = new Hono();

app.use("*", cors());
app.use("*", logger());

async function main() {
app.route("/v1", v1);
app.get("/", (c) => c.text("Hello World"));
}
main();

const port = process.env.PORT || 4000;
console.log(\`Server is running: http://localhost:\${port}\`);

serve({
fetch: app.fetch,
port: Number(port),
});
`
      ),
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
      ),
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
      ),
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
      ),
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
      ),
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
      ),
      console.log(
        chalk.green(`
Project ${r} created successfully!`)
      ),
      console.log(chalk.blue("\nNext steps:")),
      console.log("1. cd", r),
      console.log(`2. ${s} run prisma:generate`),
      console.log(`3. ${s} run prisma:migrate`),
      console.log(`4. ${s} run dev`);
  },
  main = async () => {
    var r = await getProjectName();
    await createProjectStructure(r);
  };
main().catch((r) => {
  console.error(chalk.red("Error:"), r), process.exit(1);
});
