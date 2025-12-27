const vscode = require("vscode");
const path = require("path");
const { spawn } = require("child_process");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("FixMate extension is now active!");

  // 🔹 Output channel (one time)
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

        // 2️⃣ agent.mjs path
        const agentPath = path.join(context.extensionPath, "agent.mjs");

        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine("🔍 FixMate started...");
        outputChannel.appendLine(`📂 Project: ${projectPath}\n`);

        // 3️⃣ Spawn Node process
        const child = spawn("node", [agentPath, projectPath], {
          cwd: context.extensionPath,
          env: {
            ...process.env,
            GEMINI_API_KEY: vscode.workspace
              .getConfiguration("fixmate")
              .get("apiKey"),
          },
          shell: true,
        });

        // 4️⃣ STDOUT
        child.stdout.on("data", (data) => {
          outputChannel.append(data.toString());
        });

        // 5️⃣ STDERR
        child.stderr.on("data", (data) => {
          outputChannel.appendLine("\n❌ ERROR:");
          outputChannel.append(data.toString());
        });

        // 6️⃣ Process close
        child.on("close", (code) => {
          if (code === 0) {
            outputChannel.appendLine(
              "\n✅ FixMate review completed successfully."
            );
          } else {
            outputChannel.appendLine(`\n⚠️ FixMate exited with code ${code}`);
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
