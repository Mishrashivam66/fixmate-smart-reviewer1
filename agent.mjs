import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

/**
 * API KEY
 * priority:
 * 1. process.env.GEMINI_API_KEY (extension spawn se)
 */
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not provided");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

/* =========================================
   TOOL FUNCTIONS
========================================= */

async function listFiles({ directory }) {
  const files = [];
  const extensions = [".js", ".jsx", ".ts", ".tsx", ".html", ".css"];

  function scan(dir) {
    let items;
    try {
      items = fs.readdirSync(dir);
    } catch {
      return;
    }

    for (const item of items) {
      const fullPath = path.join(dir, item);

      if (
        fullPath.includes("node_modules") ||
        fullPath.includes("dist") ||
        fullPath.includes("build")
      ) {
        continue;
      }

      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (stat.isFile()) {
        if (extensions.includes(path.extname(item))) {
          files.push(fullPath);
        }
      }
    }
  }

  scan(directory);
  return { files };
}

async function readFile({ file_path }) {
  try {
    const content = fs.readFileSync(file_path, "utf-8");
    return { content };
  } catch {
    return { content: "" };
  }
}

async function writeFile({ file_path, content }) {
  try {
    fs.writeFileSync(file_path, content, "utf-8");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* =========================================
   TOOL REGISTRY
========================================= */

const tools = {
  list_files: listFiles,
  read_file: readFile,
  write_file: writeFile,
};

/* =========================================
   TOOL DECLARATIONS
========================================= */

const listFilesTool = {
  name: "list_files",
  description: "List all relevant code files",
  parameters: {
    type: Type.OBJECT,
    properties: {
      directory: { type: Type.STRING },
    },
    required: ["directory"],
  },
};

const readFileTool = {
  name: "read_file",
  description: "Read file content",
  parameters: {
    type: Type.OBJECT,
    properties: {
      file_path: { type: Type.STRING },
    },
    required: ["file_path"],
  },
};

const writeFileTool = {
  name: "write_file",
  description: "Write fixed code to file",
  parameters: {
    type: Type.OBJECT,
    properties: {
      file_path: { type: Type.STRING },
      content: { type: Type.STRING },
    },
    required: ["file_path", "content"],
  },
};

/* =========================================
   MAIN AGENT
========================================= */

export async function runAgent(directoryPath) {
  console.log(`🔍 Reviewing: ${directoryPath}\n`);

  const history = [
    {
      role: "user",
      parts: [{ text: `Review and fix all code in: ${directoryPath}` }],
    },
  ];

  const MAX_STEPS = 20;
  let steps = 0;

  while (steps < MAX_STEPS) {
    steps++;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction: `
You are an expert software code reviewer.

Tasks:
1. Use list_files to discover files
2. Use read_file to read them
3. Fix real bugs, security issues, bad practices
4. Use write_file to apply fixes
5. Finally output a TEXT summary
`,
        tools: [
          {
            functionDeclarations: [listFilesTool, readFileTool, writeFileTool],
          },
        ],
      },
    });

    if (result.functionCalls?.length) {
      for (const call of result.functionCalls) {
        const toolResult = await tools[call.name](call.args);

        history.push({
          role: "model",
          parts: [{ functionCall: call }],
        });

        history.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: { result: toolResult },
              },
            },
          ],
        });
      }
    } else {
      console.log(result.text || "✅ Review complete");
      break;
    }
  }
}

/* =========================================
   CLI ENTRY
========================================= */

const targetDir = process.argv[2];

if (!targetDir) {
  console.error("❌ No directory provided");
  process.exit(1);
}

await runAgent(targetDir);
