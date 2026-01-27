export type RedactionRule =
  | { type: "regex"; pattern: string; flags?: string; replace?: string }
  | { type: "keyValue"; keys: string[]; mask?: string };

export interface Config {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  maxFileLines: number;
  additionalExcludes: string[];
  includeProjectTree: boolean;
  includeGlobs: string[];
  excludeGlobs: string[];
  redact: boolean;
  redactionRules: RedactionRule[];
  redactMask: string;
}

export const DEFAULT_CONFIG: Config = {
  maxFiles: 10000,
  maxFileBytes: 5_000_000,
  maxTotalBytes: 100_000_000,
  maxFileLines: 50000,
  additionalExcludes: [],
  includeProjectTree: true,
  includeGlobs: [],
  excludeGlobs: [],
  redact: true,
  redactMask: "***REDACTED***",
  redactionRules: [
    {
      type: "keyValue",
      keys: ["apiKey", "apikey", "api_key", "token", "accessToken", "secret", "password"],
      mask: "***REDACTED***",
    },
    {
      type: "regex",
      pattern: "(Bearer\\s+)[A-Za-z0-9._\\-]+",
      flags: "g",
      replace: "$1***REDACTED***",
    },
    { type: "regex", pattern: "\\bAKIA[0-9A-Z]{16}\\b", flags: "g", replace: "***REDACTED***" },
    {
      type: "regex",
      pattern: "-----BEGIN ([A-Z ]+)-----[\\s\\S]*?-----END \\1-----",
      flags: "g",
      replace: "-----BEGIN $1-----\n***REDACTED***\n-----END $1-----",
    },
  ],
};
