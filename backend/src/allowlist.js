import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.js";

let allowlist = null;

function load() {
  try {
    const raw = readFileSync(resolve(config.allowlistPath), "utf8");
    allowlist = JSON.parse(raw);
  } catch (err) {
    console.warn(`[allowlist] failed to load ${config.allowlistPath}: ${err.message}`);
    allowlist = {};
  }
}

export function lookupEmail(email) {
  if (allowlist === null) load();
  if (!email) return null;
  return allowlist[email.toLowerCase()] ?? allowlist[email] ?? null;
}

export function reloadAllowlist() {
  allowlist = null;
}
