import { advisoryEcosystem, detectEcosystems } from "@/lib/analysis/ecosystem";
import { assessRemediationReadiness } from "@/lib/checks/readiness";
import type { Scan } from "@/lib/store";

export function publicScan(scan: Scan) {
  return {
    ...scan,
    files: scan.files.map((file) => ({
      path: file.path,
      bytes: file.content.length,
    })),
    readiness: assessRemediationReadiness(scan),
    ecosystems: detectEcosystems(scan.files),
    advisoryEcosystem: advisoryEcosystem(scan.advisory),
  };
}
