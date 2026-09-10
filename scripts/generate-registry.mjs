#!/usr/bin/env node

import { globSync } from "glob";
import fs from "node:fs";

const registryPath = "registry.json";
const basePath = "src";
// `glob` patterns must use forward slashes on every platform. Using
// `path.join()` here produces backslashes on Windows, which makes the glob
// silently match no components and truncates the generated registry.
const atomicCrmComponentsPath = `${basePath}/components/atomic-crm`;
const supabaseComponentsPath = `${basePath}/components/supabase`;
const hooksPath = `${basePath}/hooks`;
const libPath = `${basePath}/lib`;

const excludedHooks = [
  "filter-context.tsx",
  "saved-queries.tsx",
  "use-mobile.ts",
  "useSupportCreateSuggestion.tsx",
];

const excludedLibFiles = [
  "field.type.ts",
  "genericMemo.ts",
  "i18nProvider.ts",
  "sanitizeInputRestProps.ts",
  "utils.ts",
];

const testFilePattern = "**/*.{test,spec}.*";
const storyFilePattern = "**/*.stories.*";
const toPosixPath = (filePath) => filePath.replaceAll("\\", "/");
const getBasename = (filePath) => toPosixPath(filePath).split("/").at(-1);

const atomicCrmComponents = globSync(`${atomicCrmComponentsPath}/**/*.ts*`, {
  ignore: [testFilePattern, storyFilePattern],
}).map(toPosixPath);
const supabaseComponents = globSync(`${supabaseComponentsPath}/**/*.ts*`, {
  ignore: [testFilePattern, storyFilePattern],
}).map(toPosixPath);
const hooks = globSync(`${hooksPath}/**/*.ts*`).filter((hook) => {
  return !excludedHooks.includes(getBasename(hook));
});
const libFiles = globSync(`${libPath}/**/*.ts*`).filter((file) => {
  return !excludedLibFiles.includes(getBasename(file));
});
const changelogPath = "CHANGELOG.md";

const registryContent = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

const files = [
  ...atomicCrmComponents.map((path) => {
    return {
      path,
      type: "registry:component",
    };
  }),
  ...supabaseComponents.map((path) => {
    return {
      path,
      type: "registry:component",
    };
  }),
  ...hooks.map(toPosixPath).map((path) => {
    return {
      path,
      type: "registry:hook",
    };
  }),
  ...libFiles.map(toPosixPath).map((path) => {
    return {
      path,
      type: "registry:lib",
    };
  }),
  {
    path: changelogPath,
    type: "registry:file",
    target: "~/CHANGELOG.md",
  },
];

const newRegistryContent = {
  ...registryContent,
  items: registryContent.items.map((item) => {
    if (item.name === "atomic-crm") {
      return {
        ...item,
        files,
      };
    }

    return item;
  }),
};

fs.writeFileSync(
  registryPath,
  JSON.stringify(newRegistryContent, null, 2),
  "utf-8",
);
