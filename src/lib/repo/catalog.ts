export type RepoOrigin = "synthetic_fixture" | "public_github";

export type RepoChoice = {
  id: string;
  name: string;
  origin: RepoOrigin;
  language: "php" | "node" | "python" | "mixed";
  description: string;
  homepage?: string;
  zipUrl?: string;
  localZip?: string;
  downloadHint?: string;
};

export const REPO_CATALOG: RepoChoice[] = [
  {
    id: "legacy-billing-php",
    name: "Harbor Ledger (synthetic fixture)",
    origin: "synthetic_fixture",
    language: "php",
    description:
      "Not a real company. We wrote this small municipal-billing PHP app so the 7.4 → 8.2 demo is reliable.",
  },
  {
    id: "php-calculator",
    name: "sspangsberg/PHP-Calculator",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/sspangsberg/PHP-Calculator",
    zipUrl: "https://github.com/sspangsberg/PHP-Calculator/archive/refs/heads/main.zip",
    localZip: "php-calculator.zip",
    description:
      "Real public repo. Dockerfile is php:7.4-fpm-alpine and Composer platform is 7.4.0.",
  },
  {
    id: "phpoidc",
    name: "r3dlin3/phpOIDC",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/r3dlin3/phpOIDC",
    zipUrl: "https://github.com/r3dlin3/phpOIDC/archive/refs/heads/master.zip",
    localZip: "phpoidc.zip",
    description: "Real public OpenID Connect PHP app. Dockerfile is FROM php:7.4-apache.",
  },
  {
    id: "cachet-2",
    name: "cachethq/cachet v2.4.1",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/cachethq/cachet/tree/v2.4.1",
    zipUrl: "https://github.com/cachethq/cachet/archive/refs/tags/v2.4.1.zip",
    localZip: "cachet-2.zip",
    description:
      "Real 2018 Cachet status-page release. Composer platform pin is 7.1.3 — older than the 7.4 EOL range.",
  },
  {
    id: "laravel-12",
    name: "laravel/laravel 12.x",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/laravel/laravel",
    zipUrl: "https://github.com/laravel/laravel/archive/refs/heads/12.x.zip",
    localZip: "laravel-12.zip",
    description: "Official Laravel 12 skeleton. require.php is ^8.2.",
  },
  {
    id: "laravel-8",
    name: "laravel/laravel v8.6.12 (2021)",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/laravel/laravel/tree/v8.6.12",
    zipUrl: "https://github.com/laravel/laravel/archive/refs/tags/v8.6.12.zip",
    localZip: "laravel-8.zip",
    description: "Historical Laravel 8 skeleton. PHP constraint is ^7.3|^8.0.",
  },
  {
    id: "slim-skeleton",
    name: "slimphp/Slim-Skeleton",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/slimphp/Slim-Skeleton",
    zipUrl: "https://github.com/slimphp/Slim-Skeleton/archive/refs/heads/master.zip",
    localZip: "slim-skeleton.zip",
    description: "Official Slim 4 skeleton. Constraint is ^7.4 || ^8.0.",
  },
  {
    id: "yii2-basic",
    name: "yiisoft/yii2-app-basic",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/yiisoft/yii2-app-basic",
    zipUrl: "https://github.com/yiisoft/yii2-app-basic/archive/refs/heads/master.zip",
    localZip: "yii2-basic.zip",
    description: "Official Yii2 basic template. require.php is >=8.2.",
  },
  {
    id: "docker-php-sample",
    name: "docker/docker-php-sample",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/docker/docker-php-sample",
    zipUrl: "https://github.com/docker/docker-php-sample/archive/refs/heads/main.zip",
    localZip: "docker-php-sample.zip",
    description:
      "Official Docker PHP sample. Tiny archive — may have little runtime evidence.",
  },
  {
    id: "symfony-demo",
    name: "symfony/demo",
    origin: "public_github",
    language: "php",
    homepage: "https://github.com/symfony/demo",
    zipUrl: "https://github.com/symfony/demo/archive/refs/heads/main.zip",
    localZip: "symfony-demo.zip",
    description: "Official Symfony demo. Detected pin in this archive was PHP 8.4.1.",
  },
  {
    id: "node-docker-defaults",
    name: "BretFisher/node-docker-good-defaults",
    origin: "public_github",
    language: "node",
    homepage: "https://github.com/BretFisher/node-docker-good-defaults",
    zipUrl: "https://github.com/BretFisher/node-docker-good-defaults/archive/refs/heads/main.zip",
    localZip: "node-docker-defaults.zip",
    description:
      "Real public Node + Docker starter. Current main Dockerfile is node:18-slim — outside the Node 16 EOL range.",
  },
  {
    id: "getting-started-app",
    name: "docker/getting-started-app",
    origin: "public_github",
    language: "node",
    homepage: "https://github.com/docker/getting-started-app",
    zipUrl: "https://github.com/docker/getting-started-app/archive/refs/heads/main.zip",
    localZip: "getting-started-app.zip",
    description:
      "Official Docker getting-started Node app. No Node image pin in the archive we cached.",
  },
  {
    id: "flask-tutorial",
    name: "pallets/flask 2.0.3",
    origin: "public_github",
    language: "python",
    homepage: "https://github.com/pallets/flask/tree/2.0.3",
    zipUrl: "https://github.com/pallets/flask/archive/refs/tags/2.0.3.zip",
    localZip: "flask-2.0.3.zip",
    description:
      "Historical Flask 2.0.3. Python 3.8 EOL is evaluated from whatever pins the archive actually has.",
  },
];

export function getRepoChoice(id: string): RepoChoice | undefined {
  return REPO_CATALOG.find((item) => item.id === id);
}

export function isAllowedArchiveUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "github.com" || parsed.hostname === "codeload.github.com") &&
      /\/archive\/.+\.zip$/i.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}
