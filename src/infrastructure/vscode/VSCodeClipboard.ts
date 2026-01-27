import * as vscode from "vscode";
import type { IClipboard } from "../../domain/ports";

export class VSCodeClipboard implements IClipboard {
  async writeText(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
  }
}
