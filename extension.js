const vscode = require("vscode");
const { spawn } = require("child_process");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("FixMate extension is now active!");

  const outputChannel = vscode.window.createOutputChannel("FixMate");

  const disposable = vscode.commands.registerCommand(
    "fixmate.reviewProject",
    async () => {
      try {
        // 1️⃣ Folder picker
        const folderUri = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: "Select Project Folder",
        });

        if (!folderUri || folderUri.length === 0) {
          vscode.window.showWarningMessage("No folder selected.");
          return;
        }

        const projectPath = folderUri[0].fsPath;

        // 2️⃣ API key check
        const apiKey = vscode.workspace
          .getConfiguration("fixmate")
          .get("apiKey");

        if (!apiKey) {
          vscode.window.showErrorMessage(
            "FixMate: Please set your Gemini API key in Settings."
          );
          return;
        }

        // 3️⃣ Bundled agent path
        const agentPath = context.asAbsolutePath("dist/agent.js");

        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(" FixMate started...");
        outputChannel.appendLine(`Project: ${projectPath}\n`);

        // 4️⃣ Spawn agent
        const child = spawn("node", [agentPath, projectPath], {
          cwd: context.extensionPath,
          env: {
            ...process.env,
            GEMINI_API_KEY: apiKey,
          },
        });

        // 5️⃣ STDOUT
        child.stdout.on("data", (data) => {
          outputChannel.append(data.toString());
        });

        // 6️⃣ STDERR
        child.stderr.on("data", (data) => {
          outputChannel.appendLine("\n ERROR:");
          outputChannel.append(data.toString());
        });

        // 7️⃣ Exit code
        child.on("close", (code) => {
          if (code === 0) {
            outputChannel.appendLine(
              "\n FixMate review completed successfully."
            );
          } else {
            outputChannel.appendLine(`\n FixMate exited with code ${code}`);
          }
        });
      } catch (err) {
        vscode.window.showErrorMessage(
          "FixMate failed to start. See output for details."
        );
        outputChannel.appendLine(err.message);
      }
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
