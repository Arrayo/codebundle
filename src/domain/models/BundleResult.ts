import type { FileInfo, Truncation } from "./FileInfo";

export interface BundleResult {
  markdown: string;
  filesIncluded: FileInfo[];
  truncations: Truncation[];
  skippedByBudget: boolean;
}
