import { saveReport, logActivity, type ReportKind } from "./reports.functions";

// jsPDF doc → base64 (no data: prefix)
export function pdfToBase64(doc: {
  output: (t: "datauristring") => string;
}): string {
  const uri = doc.output("datauristring");
  const i = uri.indexOf(",");
  return i >= 0 ? uri.slice(i + 1) : uri;
}

export async function saveGeneratedReport(opts: {
  title: string;
  kind: ReportKind;
  summary?: string;
  doc: { output: (t: "datauristring") => string };
  activityDetail?: string;
}) {
  const pdfBase64 = pdfToBase64(opts.doc);
  try {
    await saveReport({
      data: {
        title: opts.title,
        kind: opts.kind,
        summary: opts.summary,
        pdfBase64,
      },
    });
    await logActivity({
      data: {
        kind: opts.kind,
        title: opts.title,
        detail: opts.activityDetail ?? opts.summary ?? "",
      },
    });
  } catch (e) {
    // don't block the download if save fails
    console.error("Failed to save report:", e);
  }
}
