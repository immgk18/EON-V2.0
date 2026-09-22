"use client";

import { useMemo, useRef, useState } from "react";

type FileResult = {
  name: string;
  type: string;
  size: number;
  status: "ready" | "analyzing" | "complete" | "error";
  response?: string;
};

const ACCEPT =
  ".pdf,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc,.txt,.md,.json";

const API = "https://eon-v2-0.onrender.com";

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  xlsx: "EXCEL",
  xls: "EXCEL",
  csv: "CSV",
  pptx: "POWERPOINT",
  ppt: "POWERPOINT",
  docx: "WORD",
  doc: "WORD",
  txt: "TEXT",
  md: "TEXT",
  json: "DATA",
};

function extension(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileIntelligence() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [question, setQuestion] = useState("");
  const [dragging, setDragging] = useState(false);

  const readyFiles = useMemo(
    () => files.filter((file) => file.status === "ready" || file.status === "complete"),
    [files]
  );

  const addFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    const accepted = next.filter((file) => {
      const ext = extension(file.name);
      return Boolean(TYPE_LABELS[ext]) && file.size <= 15 * 1024 * 1024;
    });

    setFiles((current) => [
      ...current,
      ...accepted.map((file) => ({
        name: file.name,
        type: TYPE_LABELS[extension(file.name)] || "FILE",
        size: file.size,
        status: "ready" as const,
      })),
    ]);
  };

  const analyze = async () => {
    if (!readyFiles.length || busy) return;

    const browserFiles = inputRef.current?.files
      ? Array.from(inputRef.current.files)
      : [];

    if (!browserFiles.length) {
      setAnalysis("SELECT THE FILES AGAIN TO START ANALYSIS.");
      return;
    }

    setBusy(true);
    setAnalysis("EON FILE INTELLIGENCE IS ANALYZING...");

    setFiles((current) =>
      current.map((file) =>
        readyFiles.some((item) => item.name === file.name)
          ? { ...file, status: "analyzing" }
          : file
      )
    );

    try {
      const form = new FormData();
      browserFiles.forEach((file) => form.append("files", file));
      form.append(
        "question",
        question.trim() ||
          "Analyze these files. Give a concise executive summary, key findings, important numbers, and useful relationships between the files. Clearly separate facts from uncertainty."
      );

      const response = await fetch(`${API}/api/files/analyze`, {
        method: "POST",
        body: form,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "EON file analysis failed."
        );
      }

      setAnalysis(data.response || "Analysis completed.");
      setFiles((current) =>
        current.map((file) =>
          readyFiles.some((item) => item.name === file.name)
            ? { ...file, status: "complete" }
            : file
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "EON could not analyze the files.";
      setAnalysis(message.toUpperCase());
      setFiles((current) =>
        current.map((file) =>
          readyFiles.some((item) => item.name === file.name)
            ? { ...file, status: "error" }
            : file
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setAnalysis("");
    setQuestion("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="eonFileCenter">
      <style jsx>{`
        .eonFileCenter{display:flex;flex-direction:column;gap:12px;height:100%;color:rgba(245,232,168,.82);font-family:monospace}
        .fileTitle{font-size:10px;font-weight:800;letter-spacing:.18em;color:var(--desktop-accent,#ffd84d)}
        .fileSub{font-size:7px;line-height:1.6;color:rgba(245,232,168,.38);letter-spacing:.06em}
        .drop{border:1px dashed rgba(255,216,77,.22);border-radius:8px;padding:22px 12px;text-align:center;background:rgba(255,216,77,.025);cursor:pointer;transition:.16s}
        .drop:hover,.drop.dragging{border-color:var(--desktop-accent,#ffd84d);background:rgba(255,216,77,.07);box-shadow:0 0 22px rgba(255,216,77,.08)}
        .dropIcon{font-size:22px;color:var(--desktop-accent,#ffd84d);margin-bottom:8px}
        .dropMain{font-size:8px;font-weight:800;letter-spacing:.1em;color:var(--desktop-accent,#ffd84d)}
        .dropHint{margin-top:7px;font-size:6px;color:rgba(245,232,168,.3);line-height:1.6}
        .fileList{display:flex;flex-direction:column;gap:6px;max-height:150px;overflow:auto}
        .fileItem{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid rgba(255,216,77,.09);border-radius:5px;background:rgba(255,216,77,.018)}
        .fileIcon{width:31px;height:27px;display:grid;place-items:center;border:1px solid rgba(255,216,77,.15);border-radius:4px;color:var(--desktop-accent,#ffd84d);font-size:6px;font-weight:800}
        .fileInfo{min-width:0;flex:1}.fileName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7px;color:rgba(245,232,168,.7)}.fileMeta{margin-top:3px;font-size:6px;color:rgba(245,232,168,.3)}
        .status{font-size:6px;color:var(--desktop-accent,#ffd84d)}
        .question{width:100%;min-height:54px;resize:vertical;box-sizing:border-box;border:1px solid rgba(255,216,77,.12);border-radius:6px;background:rgba(0,0,0,.2);color:var(--desktop-accent,#ffd84d);outline:none;padding:9px;font:7px/1.5 monospace}
        .question::placeholder{color:rgba(245,232,168,.22)}
        .actions{display:flex;gap:7px}.action{flex:1;min-height:34px;border:1px solid rgba(255,216,77,.16);border-radius:5px;background:rgba(255,216,77,.035);color:var(--desktop-accent,#ffd84d);cursor:pointer;font:800 7px monospace;letter-spacing:.1em}.action:hover{background:rgba(255,216,77,.09)}.action:disabled{opacity:.35;cursor:not-allowed}
        .result{flex:1;min-height:80px;overflow:auto;border:1px solid rgba(255,216,77,.08);border-radius:6px;padding:10px;background:rgba(0,0,0,.16);font:7px/1.65 monospace;white-space:pre-wrap;color:rgba(245,232,168,.68)}
        .result:empty:before{content:"ANALYSIS OUTPUT WILL APPEAR HERE";color:rgba(245,232,168,.22)}
        @media(max-width:700px){.eonFileCenter{padding-bottom:8px}.fileList{max-height:120px}}
      `}</style>

      <div>
        <div className="fileTitle">FILE INTELLIGENCE</div>
        <div className="fileSub">
          Upload PDF, Excel, PowerPoint, Word, CSV or text files. EON can analyze multiple files together.
        </div>
      </div>

      <label
        className={`drop ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <div className="dropIcon">＋</div>
        <div className="dropMain">DROP FILES OR BROWSE</div>
        <div className="dropHint">
          PDF • EXCEL • POWERPOINT • WORD • CSV • TXT<br />
          MAX 15 MB PER FILE
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
          }}
          style={{ display: "none" }}
        />
      </label>

      {files.length > 0 && (
        <div className="fileList">
          {files.map((file, index) => (
            <div className="fileItem" key={`${file.name}-${index}`}>
              <div className="fileIcon">{file.type}</div>
              <div className="fileInfo">
                <div className="fileName">{file.name}</div>
                <div className="fileMeta">{formatSize(file.size)}</div>
              </div>
              <div className="status">
                {file.status === "analyzing" ? "..." : file.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      <textarea
        className="question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Optional: ask EON something about the uploaded files..."
      />

      <div className="actions">
        <button className="action" type="button" onClick={analyze} disabled={!readyFiles.length || busy}>
          {busy ? "ANALYZING..." : "ANALYZE FILES"}
        </button>
        <button className="action" type="button" onClick={clearFiles} disabled={busy}>
          CLEAR
        </button>
      </div>

      <div className="result" aria-live="polite">
        {analysis}
      </div>
    </section>
  );
}
