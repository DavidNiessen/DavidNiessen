import type { IconName } from "./lib/icons.js";

export interface StackRing {
  label: string;
  items: { icon: IconName; name: string }[];
}

export const config = {
  login: "DavidNiessen",
  name: "David Nießen",
  /** cycled by the hero typewriter */
  roles: [
    "Software Engineer",
    "building cloud-native systems",
    "Kotlin & Spring on the JVM",
    "Kubernetes on AWS",
    "shipping with GitHub Actions",
  ],
  birthday: "2004-12-31",
  company: "Axel Springer SE",
  /** used for greeting, local time and the weather tile */
  location: { city: "Berlin", latitude: 52.52, longitude: 13.405 },
  links: {
    linkedin: "https://niessen.dev/in",
    instagram: "https://niessen.dev/ig",
    website: "https://niessen.dev",
  },
  /** where the generated assets are served from (the `output` branch) */
  assetBase: "https://raw.githubusercontent.com/DavidNiessen/DavidNiessen/output",
  stack: [
    {
      label: "BACKEND",
      items: [
        { icon: "java", name: "Java" },
        { icon: "spring", name: "Spring" },
        { icon: "junit", name: "JUnit" },
      ],
    },
    {
      label: "OPS / INFRA",
      items: [
        { icon: "aws", name: "AWS" },
        { icon: "kubernetes", name: "Kubernetes" },
        { icon: "githubactions", name: "GitHub Actions" },
        { icon: "mongodb", name: "MongoDB" },
      ],
    },
    {
      label: "FRONTEND",
      items: [
        { icon: "typescript", name: "TypeScript" },
        { icon: "react", name: "React" },
        { icon: "playwright", name: "Playwright" },
      ],
    },
  ] satisfies StackRing[],
  skills: ["kotlin", "java", "spring", "junit", "aws", "k8s", "gh-actions", "mongodb", "typescript", "react", "playwright"],
  quotes: [
    ["Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra"],
    ["Make it work, make it right, make it fast.", "Kent Beck"],
    ["Talk is cheap. Show me the code.", "Linus Torvalds"],
    ["First, solve the problem. Then, write the code.", "John Johnson"],
    ["Premature optimization is the root of all evil.", "Donald Knuth"],
    ["Good programmers write code that humans can understand.", "Martin Fowler"],
    ["The best error message is the one that never shows up.", "Thomas Fuchs"],
    ["Deleted code is debugged code.", "Jeff Sickel"],
    ["Programs must be written for people to read.", "Harold Abelson"],
    ["Testing leads to failure, and failure leads to understanding.", "Burt Rutan"],
    ["Simplicity is the soul of efficiency.", "Austin Freeman"],
    ["Code never lies, comments sometimes do.", "Ron Jeffries"],
    ["Automate the boring stuff.", "Al Sweigart"],
    ["You build it, you run it.", "Werner Vogels"],
  ] as [string, string][],
};

export type Config = typeof config;
