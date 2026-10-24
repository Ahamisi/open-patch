import { extractDockerImageTag } from "@/lib/analysis/docker-image";
import { advisoryEcosystem, detectEcosystems, hasEcosystemSignals } from "@/lib/analysis/ecosystem";
import {
  extractCiNodeVersion,
  extractNodeEngines,
  extractNodeVersionFile,
} from "@/lib/analysis/node-version";
import {
  extractCiPhpVersion,
  extractComposerPhpConstraint,
  extractComposerPlatformPhp,
  extractDockerfilePhp,
  mentionsImagick,
  constraintOverlap,
  versionSatisfies,
} from "@/lib/analysis/php-version";
import {
  extractCiPythonVersion,
  extractPythonVersionFile,
  extractRequiresPython,
} from "@/lib/analysis/python-version";
import { findFile } from "@/lib/repo/inventory";
import type { CheckResult, ExposureAssessment, RepositoryEvidence } from "@/lib/schemas";
import type { Advisory, RepoFile } from "@/lib/store";

function evidenceId(evidence: RepositoryEvidence[], filePath: string): string | null {
  return evidence.find((item) => item.path === filePath)?.id ?? null;
}

export function assessExposure(
  advisory: Advisory,
  files: RepoFile[],
  evidence: RepositoryEvidence[],
): ExposureAssessment {
  const ecosystem = advisoryEcosystem(advisory);
  if (ecosystem === "node") return assessNodeRange(advisory, files, evidence);
  if (ecosystem === "python") return assessPythonRange(advisory, files, evidence);
  if (
    ecosystem !== "php" &&
    ecosystem !== "unknown" &&
    !hasEcosystemSignals(files, ecosystem)
  ) {
    return {
      status: "unknown",
      component: advisory.component,
      detectedVersion: null,
      affectedRange: advisory.affectedRange,
      reason: `This advisory is ${ecosystem}. The archive languages we could detect are ${detectEcosystems(files).join(", ") || "none"}. No ${ecosystem} runtime pin was established.`,
      evidenceIds: [],
      checks: [],
      limitations: [
        `${ecosystem} pack inventory ran. A source edit is not inferred from a missing runtime.`,
      ],
    };
  }

  const dockerfile = findFile(files, "Dockerfile");
  const composer = findFile(files, "composer.json");
  const lock = findFile(files, "composer.lock");
  const phpVersionFile = findFile(files, ".php-version");
  const ci = files.find((file) => file.path.includes(".github/workflows/"));

  const dockerPhp = dockerfile ? extractDockerfilePhp(dockerfile.content) : null;
  const composerConstraint = composer
    ? extractComposerPhpConstraint(composer.content)
    : null;
  const platformPhp =
    (composer ? extractComposerPlatformPhp(composer.content) : null) ??
    (lock ? extractComposerPlatformPhp(lock.content) : null);
  const pinPhp = phpVersionFile?.content.trim() || null;
  const ciPhp = ci ? extractCiPhpVersion(ci.content) : null;
  const detectedVersion = dockerPhp ?? pinPhp ?? platformPhp ?? ciPhp ?? null;

  const ids = [
    dockerfile && evidenceId(evidence, dockerfile.path),
    composer && evidenceId(evidence, composer.path),
    lock && evidenceId(evidence, lock.path),
    phpVersionFile && evidenceId(evidence, phpVersionFile.path),
    ci && evidenceId(evidence, ci.path),
  ].filter((id): id is string => Boolean(id));

  const checks: CheckResult[] = [
    {
      name: "dockerfile_php_tag",
      status: dockerPhp ? "pass" : "fail",
      details: dockerPhp
        ? `Dockerfile pins php:${dockerPhp}`
        : "No PHP image tag found in Dockerfile",
    },
    {
      name: "composer_php_constraint",
      status: composerConstraint ? "pass" : "fail",
      details: composerConstraint
        ? `composer.json require.php is ${composerConstraint}`
        : "composer.json PHP constraint not found",
    },
    {
      name: "ci_php_version",
      status: ciPhp ? "pass" : "fail",
      details: ciPhp ? `CI php-version is ${ciPhp}` : "CI PHP version not found",
    },
  ];

  if (advisory.id === "php-imagick-cve") {
    return assessImagick(advisory, files, evidence, detectedVersion, ids, checks);
  }
  if (advisory.id === "php-cgi-windows") {
    return assessWindowsCgi(advisory, files, evidence, detectedVersion, ids, checks);
  }
  return assessRuntimeRange(advisory, detectedVersion, composerConstraint, ids, checks);
}

function assessRuntimeRange(
  advisory: Advisory,
  detectedVersion: string | null,
  composerConstraint: string | null,
  evidenceIds: string[],
  checks: CheckResult[],
): ExposureAssessment {
  if (!detectedVersion) {
    const overlap = constraintOverlap(composerConstraint, advisory.affectedRange);
    if (overlap === "none") {
      return {
        status: "not_affected",
        component: advisory.component,
        detectedVersion: null,
        affectedRange: advisory.affectedRange,
        reason: `No exact runtime pin was found. The ${advisory.component} constraint is ${composerConstraint}, which does not overlap the advisory range ${advisory.affectedRange}. This is inferred from the constraint, not a live process.`,
        evidenceIds,
        checks,
        limitations: [
          "No Dockerfile / version-file / CI pin was present.",
          "A production host could still ignore the manifest constraint.",
        ],
      };
    }
    if (overlap === "all") {
      return {
        status: "affected",
        component: advisory.component,
        detectedVersion: null,
        affectedRange: advisory.affectedRange,
        reason: `No exact runtime pin was found. The ${advisory.component} constraint is ${composerConstraint}, and every probed version in that constraint falls inside ${advisory.affectedRange}.`,
        evidenceIds,
        checks,
        limitations: [
          "Inferred from the manifest constraint only. No image or CI pin was present.",
        ],
      };
    }
    return {
      status: "unknown",
      component: advisory.component,
      detectedVersion: null,
      affectedRange: advisory.affectedRange,
      reason: composerConstraint
        ? `No exact ${advisory.component} pin was found. The constraint is ${composerConstraint}, which can include both affected and unaffected versions of ${advisory.affectedRange}. Returning unknown.`
        : `${advisory.component} runtime version could not be established from Dockerfile, version files, manifest, or CI. Returning unknown rather than a confident conclusion.`,
      evidenceIds,
      checks,
      limitations: [
        "No executable repository scripts were run.",
        "Production runtime may differ from repository pins.",
      ],
    };
  }

  const hit = versionSatisfies(detectedVersion, advisory.affectedRange);
  if (hit === null) {
    return {
      status: "unknown",
      component: advisory.component,
      detectedVersion,
      affectedRange: advisory.affectedRange,
      reason: `Detected ${advisory.component} ${detectedVersion}, but the advisory range ${advisory.affectedRange ?? "(none)"} could not be evaluated.`,
      evidenceIds,
      checks,
      limitations: ["Range parser did not understand the advisory constraint."],
    };
  }

  return {
    status: hit ? "affected" : "not_affected",
    component: advisory.component,
    detectedVersion,
    affectedRange: advisory.affectedRange,
    reason: hit
      ? `Detected ${advisory.component} ${detectedVersion} is inside the advisory range ${advisory.affectedRange}. This is a runtime/platform finding; an application source patch cannot remediate the interpreter.`
      : `Detected ${advisory.component} ${detectedVersion} is outside the advisory range ${advisory.affectedRange}.`,
    evidenceIds,
    checks,
    limitations: [
      "Version comparison uses repository pins, not a live production probe.",
      "Composer scripts and container builds were not executed.",
    ],
  };
}

function assessImagick(
  advisory: Advisory,
  files: RepoFile[],
  evidence: RepositoryEvidence[],
  detectedVersion: string | null,
  evidenceIds: string[],
  checks: CheckResult[],
): ExposureAssessment {
  const hits = files.filter((file) => mentionsImagick(file.content));
  const imagickIds = hits
    .map((file) => evidence.find((item) => item.path === file.path)?.id)
    .filter((id): id is string => Boolean(id));

  checks.push({
    name: "imagick_presence",
    status: hits.length === 0 ? "pass" : "fail",
    details:
      hits.length === 0
        ? "No ext-imagick / imagick references found in inspected files"
        : `Imagick mentioned in ${hits.map((file) => file.path).join(", ")}`,
  });

  if (hits.length === 0) {
    return {
      status: "not_affected",
      component: advisory.component,
      detectedVersion,
      affectedRange: advisory.affectedRange,
      reason:
        "The advisory concerns ext-imagick. Inspected manifests, Dockerfile, CI, and source contain no Imagick requirement or extension install.",
      evidenceIds: [...evidenceIds, ...imagickIds],
      checks,
      limitations: [
        "Absence in the repository is not a runtime process list. Production could still load a server-level extension.",
      ],
    };
  }

  return {
    status: "affected",
    component: advisory.component,
    detectedVersion: null,
    affectedRange: advisory.affectedRange,
    reason: "Imagick appears in repository evidence and no safe version pin was found.",
    evidenceIds: [...evidenceIds, ...imagickIds],
    checks,
    limitations: ["Imagick version could not be confirmed."],
  };
}

function assessWindowsCgi(
  advisory: Advisory,
  files: RepoFile[],
  _evidence: RepositoryEvidence[],
  detectedVersion: string | null,
  evidenceIds: string[],
  checks: CheckResult[],
): ExposureAssessment {
  const joined = files.map((file) => file.content).join("\n");
  const windowsHint = /windows|win32|iis/i.test(joined);
  const linuxHint = /php:\d+\.\d+-apache|ubuntu-latest|linux/i.test(joined);

  checks.push({
    name: "production_os",
    status: "fail",
    details: windowsHint
      ? "Windows indicators found, but production SAPI is still unconfirmed"
      : linuxHint
        ? "Linux/container indicators found; production host OS was not established"
        : "No production OS evidence",
  });

  return {
    status: "unknown",
    component: advisory.component,
    detectedVersion,
    affectedRange: advisory.affectedRange,
    reason:
      "CVE-2024-4577 is specific to PHP CGI on Windows. Repository images and CI runners are not sufficient to establish the production OS or SAPI, so exposure is unknown.",
    evidenceIds,
    checks,
    limitations: [
      "A Linux Dockerfile is not proof of the production host.",
      "SAPI (cgi vs apache module vs fpm) was not observed at runtime.",
    ],
  };
}

function assessNodeRange(
  advisory: Advisory,
  files: RepoFile[],
  evidence: RepositoryEvidence[],
): ExposureAssessment {
  const dockerfile = findFile(files, "Dockerfile");
  const pkg = findFile(files, "package.json");
  const nvmrc = findFile(files, ".nvmrc");
  const nodeVersion = findFile(files, ".node-version");
  const ci = files.find((file) => file.path.includes(".github/workflows/"));
  const docker = dockerfile ? extractDockerImageTag(dockerfile.content, "node") : null;
  const engines = pkg ? extractNodeEngines(pkg.content) : null;
  const filePin =
    (nvmrc ? extractNodeVersionFile(nvmrc.content) : null) ??
    (nodeVersion ? extractNodeVersionFile(nodeVersion.content) : null);
  const ciPin = ci ? extractCiNodeVersion(ci.content) : null;
  const detectedVersion = docker ?? filePin ?? ciPin ?? null;
  const ids = [dockerfile, pkg, nvmrc, nodeVersion, ci]
    .filter(Boolean)
    .map((file) => evidenceId(evidence, file!.path))
    .filter((id): id is string => Boolean(id));
  return assessRuntimeRange(advisory, detectedVersion, engines, ids, []);
}

function assessPythonRange(
  advisory: Advisory,
  files: RepoFile[],
  evidence: RepositoryEvidence[],
): ExposureAssessment {
  const dockerfile = findFile(files, "Dockerfile");
  const pyproject = findFile(files, "pyproject.toml");
  const setupCfg = findFile(files, "setup.cfg");
  const runtime = findFile(files, "runtime.txt");
  const pythonVersion = findFile(files, ".python-version");
  const ci = files.find((file) => file.path.includes(".github/workflows/"));
  const docker = dockerfile ? extractDockerImageTag(dockerfile.content, "python") : null;
  const filePin =
    (runtime ? extractPythonVersionFile(runtime.content) : null) ??
    (pythonVersion ? extractPythonVersionFile(pythonVersion.content) : null);
  const requires =
    (pyproject ? extractRequiresPython(pyproject.content) : null) ??
    (setupCfg ? extractRequiresPython(setupCfg.content) : null);
  const ciPin = ci ? extractCiPythonVersion(ci.content) : null;
  const detectedVersion = docker ?? filePin ?? ciPin ?? null;
  const ids = [dockerfile, pyproject, setupCfg, runtime, pythonVersion, ci]
    .filter(Boolean)
    .map((file) => evidenceId(evidence, file!.path))
    .filter((id): id is string => Boolean(id));
  return assessRuntimeRange(advisory, detectedVersion, requires, ids, []);
}
