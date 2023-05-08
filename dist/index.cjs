'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ci = require('ci-info');
const getRepoInfo = require('git-repo-info');
const parseGithubUrl = require('parse-github-url');
const remoteOriginUrl = require('remote-origin-url');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);
const path__default = /*#__PURE__*/_interopDefaultCompat(path);
const ci__default = /*#__PURE__*/_interopDefaultCompat(ci);
const getRepoInfo__default = /*#__PURE__*/_interopDefaultCompat(getRepoInfo);
const parseGithubUrl__default = /*#__PURE__*/_interopDefaultCompat(parseGithubUrl);
const remoteOriginUrl__default = /*#__PURE__*/_interopDefaultCompat(remoteOriginUrl);

const trimSlash = (url) => url.replace(/\/$/, "");
const unGitUrl = (url) => url.replace(/^git\+/, "").replace(/.git$/, "");
function getRepoUrl(gitRepoInfo, root = process.cwd()) {
  const getPkg = () => {
    const pkgPath = path__default.join(root, "package.json");
    try {
      return JSON.parse(fs__default.readFileSync(pkgPath, "utf8"));
    } catch {
      return void 0;
    }
  };
  const pkg = getPkg();
  if (!pkg)
    return void 0;
  const url = pkg?.repository?.url ?? pkg?.repository;
  if (url) {
    if (url.startsWith("https:")) {
      return unGitUrl(trimSlash(url));
    }
    if (url.startsWith("git+")) {
      return unGitUrl(url);
    }
    return trimSlash(`https://github.com/${url}`);
  }
  if (!gitRepoInfo.worktreeGitDir)
    return void 0;
  const remoteUrl = remoteOriginUrl__default.sync(path__default.join(gitRepoInfo.worktreeGitDir, "config"));
  if (!remoteUrl)
    return void 0;
  const parsed = parseGithubUrl__default(remoteUrl);
  if (!parsed)
    return void 0;
  return `https://github.com/${parsed.repo}`;
}

function createInfoPlugin(option) {
  const now = /* @__PURE__ */ new Date();
  const root = path__default.resolve(option?.root ?? process.cwd());
  const info = getRepoInfo__default(root);
  const github = option?.github ?? getRepoUrl(info, root);
  const ModuleName = {
    BuildTime: `${option?.prefix ?? "~build"}/time`,
    BuildInfo: `${option?.prefix ?? "~build"}/info`,
    BuildMeta: `${option?.prefix ?? "~build"}/meta`,
    BuildPackage: `${option?.prefix ?? "~build"}/package`
  };
  return {
    name: "vite-plugin-info",
    resolveId(id) {
      if (ModuleName.BuildTime === id || ModuleName.BuildInfo === id || ModuleName.BuildMeta === id || ModuleName.BuildPackage === id)
        return "\0" + id;
    },
    async load(id) {
      if (!id.startsWith("\0"))
        return;
      id = id.slice(1);
      if (id === ModuleName.BuildTime) {
        return `const time = new Date(${now.getTime()})
export default time`;
      } else if (id === ModuleName.BuildInfo) {
        if (!info.root || !info.commonGitDir || !info.worktreeGitDir) {
          this.warn("This may not be a git repo");
        }
        const gen = (key) => {
          return `export const ${key} = ${JSON.stringify(info[key])}`;
        };
        return [
          `export const CI = ${ci__default.isCI ? `"${ci__default.name}"` : "null"}`,
          `export const github = ${JSON.stringify(github ?? null)}`,
          gen("sha"),
          gen("branch"),
          gen("abbreviatedSha"),
          gen("tag"),
          gen("committer"),
          gen("committerDate"),
          gen("commitMessage"),
          gen("author"),
          gen("authorDate"),
          gen("lastTag"),
          gen("commitsSinceLastTag")
        ].join("\n");
      } else if (id === ModuleName.BuildMeta) {
        const body = Object.entries(option?.meta ?? {}).map(
          ([key, value]) => `export const ${key} = ${JSON.stringify(value, null, 2)};`
        );
        return body.join("\n");
      } else if (id === ModuleName.BuildPackage) {
        const pkg = JSON.parse(fs__default.readFileSync(path__default.join(root, "package.json"), "utf-8"));
        const entries = Object.entries({
          name: "",
          version: "0.0.0",
          description: "",
          keywords: [],
          license: "",
          author: "",
          ...pkg
        }).filter(
          ([key]) => ["name", "version", "description", "keywords", "license", "author"].includes(key)
        );
        return entries.map(([key, value]) => `export const ${key} = ${JSON.stringify(value, null, 2)};`).join("\n");
      }
    }
  };
}

module.exports = createInfoPlugin;
