import type { Config, RedactionRule } from "../models";

export class RedactionService {
  redactContent(content: string, config: Config): string {
    if (!config.redact) {
      return content;
    }

    let result = content;

    for (const rule of config.redactionRules) {
      try {
        result = this.applyRule(result, rule, config.redactMask);
      } catch (error) {
        console.warn(`Failed to apply redaction rule:`, error);
      }
    }

    return result;
  }

  private applyRule(content: string, rule: RedactionRule, defaultMask: string): string {
    if (rule.type === "regex") {
      return this.applyRegexRule(content, rule, defaultMask);
    }

    if (rule.type === "keyValue") {
      return this.applyKeyValueRule(content, rule, defaultMask);
    }

    return content;
  }

  private applyRegexRule(
    content: string,
    rule: { pattern: string; flags?: string; replace?: string },
    defaultMask: string
  ): string {
    const regex = new RegExp(rule.pattern, rule.flags ?? "g");
    return content.replace(regex, rule.replace ?? defaultMask);
  }

  private applyKeyValueRule(
    content: string,
    rule: { keys: string[]; mask?: string },
    defaultMask: string
  ): string {
    const keys = rule.keys.map((k) => this.escapeRegExp(k)).filter(Boolean);
    if (!keys.length) {
      return content;
    }

    const keyAlternation = keys.join("|");
    const mask = rule.mask ?? defaultMask;

    let result = content;

    const jsonStyle = new RegExp(
      `(["']?(?:${keyAlternation})["']?\\s*[:=]\\s*)(["'\`])([\\s\\S]*?)\\2`,
      "gi"
    );
    result = result.replace(jsonStyle, `$1$2${mask}$2`);

    const envStyle = new RegExp(`(^|\\n)\\s*(?:${keyAlternation})\\s*=\\s*.*(?=\\n|$)`, "gi");
    result = result.replace(envStyle, (match) => {
      const prefix = match.startsWith("\n") ? "\n" : "";
      const line = match.trimStart();
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) {
        return match;
      }
      const key = line.slice(0, eqIndex).trim();
      return `${prefix}${key}=${mask}`;
    });

    return result;
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
