"use client";

import { useState } from "react";
import FileIntelligence from "./FileIntelligence";

export default function FileLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        .eonFileLauncher{position:fixed;left:10px;top:50%;transform:translateY(-50%);z-index:1000}
        .eonFileLauncherBtn{width:48px;min-height:72px;border:1px solid rgba(255,216,77,.22);border-radius:8px;background:rgba(3,4,7,.86);color:#ffd84d;cursor:pointer;box-shadow:0 0 24px rgba(255,216,77,.08);backdrop-filter:blur(14px);font:800 7px/1.35 monospace;letter-spacing:.1em}
        .eonFileLauncherBtn:hover{border-color:#ffd84d;background:rgba(255,216,77,.07)}
        .eonFileLauncherIcon{display:block;font-size:18px;margin-bottom:6px}
        .eonFileOverlay{position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.58);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:flex-start;padding-left:72px}
        .eonFileModal{width:min(460px,calc(100vw - 90px));height:min(690px,calc(100vh - 40px));border:1px solid rgba(255,216,77,.18);border-radius:10px;background:rgba(4,5,8,.96);box-shadow:0 25px 80px rgba(0,0,0,.55),0 0 30px rgba(255,216,77,.08);overflow:hidden}
        .eonFileModalHeader{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border-bottom:1px solid rgba(255,216,77,.1);color:#ffd84d;font:800 8px monospace;letter-spacing:.15em}
        .eonFileClose{border:1px solid rgba(255,216,77,.14);border-radius:4px;background:transparent;color:#ffd84d;cursor:pointer;width:28px;height:26px}
        .eonFileModalBody{height:calc(100% - 42px);padding:12px;box-sizing:border-box;overflow:auto}
        @media(max-width:700px){.eonFileLauncher{left:5px}.eonFileLauncherBtn{width:42px;min-height:62px}.eonFileOverlay{padding:0 5px;justify-content:center}.eonFileModal{width:calc(100vw - 10px);height:calc(100vh - 20px)}}
      `}</style>

      <div className="eonFileLauncher">
        <button
          type="button"
          className="eonFileLauncherBtn"
          onClick={() => setOpen(true)}
          aria-label="Open EON File Intelligence"
        >
          <span className="eonFileLauncherIcon">▣</span>
          FILES
        </button>
      </div>

      {open && (
        <div className="eonFileOverlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="eonFileModal" role="dialog" aria-modal="true" aria-label="EON File Intelligence">
            <header className="eonFileModalHeader">
              <span>EON // FILE INTELLIGENCE</span>
              <button type="button" className="eonFileClose" onClick={() => setOpen(false)}>×</button>
            </header>
            <div className="eonFileModalBody">
              <FileIntelligence />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
