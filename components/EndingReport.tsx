"use client";

import { useEffect, useState } from "react";
import { judgeEnding } from "@/lib/endingJudge";
import { calculateMainProgress } from "@/lib/stateUpdater";
import { callEndingAPI, type EndingResponse } from "@/lib/llmClient";
import type { GameState } from "@/lib/types";

interface EndingReportProps {
  state: GameState;
  onRestart: () => void;
}

export function EndingReport({ state, onRestart }: EndingReportProps) {
  const [ending, setEnding] = useState<EndingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const endingTitle = judgeEnding(state);
  const progress = calculateMainProgress(state.metrics);

  useEffect(() => {
    async function fetchEnding() {
      setLoading(true);
      const result = await callEndingAPI({ state });
      if (result) {
        setEnding(result);
      }
      setLoading(false);
    }
    fetchEnding();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[var(--background)] p-4">
      {/* 像素网格背景 */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(90deg, var(--line) 1px, transparent 1px),
            linear-gradient(var(--line) 1px, transparent 1px)
          `,
          backgroundSize: "4px 4px",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <p className="ui-font text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            Hackathon 完结
          </p>
          <h1 className="mt-4 text-5xl font-black text-[var(--panel)] md:text-6xl">
            《{endingTitle}》
          </h1>
          <p className="ui-font mt-4 text-lg text-[var(--muted)]">
            项目完成度：{progress}%
          </p>
        </div>

        {/* 产品卡片 */}
        {loading ? (
          <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="ui-font text-[var(--muted)]">正在生成结局报告...</p>
          </div>
        ) : ending ? (
          <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-6 shadow-[8px_8px_0_var(--line)]">
            {/* 产品名称 */}
            <h2 className="text-3xl font-black text-[var(--ink)]">{ending.productName}</h2>
            <p className="ui-font mt-2 text-[var(--muted)]">{ending.description}</p>

            {/* 核心功能 */}
            <div className="mt-6">
              <h3 className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                核心功能
              </h3>
              <ul className="mt-2 space-y-1">
                {ending.features.map((feature, i) => (
                  <li key={i} className="ui-font text-sm text-[var(--ink)]">
                    • {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* 技术栈 */}
            <div className="mt-4">
              <h3 className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                技术栈
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {ending.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="ui-font border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* 评价 */}
            <div className="mt-6 border-t-2 pt-4" style={{ borderColor: "var(--line)" }}>
              <p className="ui-font text-sm italic text-[var(--muted)]">
                &ldquo;{ending.evaluation}&rdquo;
              </p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="ui-font text-[var(--muted)]">结局生成失败，但旅程已结束。</p>
          </div>
        )}

        {/* 角色状态 */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-4">
            <h3 className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              项目指标
            </h3>
            <div className="mt-3 space-y-2">
              <MetricBar label="功能" value={state.metrics.feature} />
              <MetricBar label="清晰" value={state.metrics.clarity} />
              <MetricBar label="稳定" value={state.metrics.stability} />
              <MetricBar label="展示" value={state.metrics.presentation} />
              <MetricBar label="创意" value={state.metrics.creativity} />
            </div>
          </div>

          <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-4">
            <h3 className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              角色状态
            </h3>
            <div className="mt-3 space-y-2">
              <MetricBar label="压力" value={state.character.pressure} color="var(--danger)" />
              <MetricBar label="自我感" value={state.character.selfhood} color="var(--accent)" />
              <MetricBar label="信任" value={state.character.trust} color="var(--success)" />
              <MetricBar label="注意力" value={state.character.focus} color="var(--primary)" />
            </div>
          </div>
        </div>

        {/* 灵感集 */}
        {state.inspirationSet.length > 0 && (
          <div className="mt-6 border-2 border-[var(--line)] bg-[var(--panel)] p-4">
            <h3 className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              灵感集（{state.inspirationSet.length}）
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.inspirationSet.map((item) => (
                <span
                  key={item}
                  className="ui-font border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 路径 */}
        <div className="mt-6 border-2 border-[var(--line)] bg-[var(--panel)] p-4">
          <h3 className="ui-font text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            路径轨迹
          </h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {state.path.map((room, i) => (
              <span
                key={`${room}-${i}`}
                className="ui-font border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
              >
                {room}
              </span>
            ))}
          </div>
        </div>

        {/* 重新开始按钮 */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onRestart}
            className="pixel-button pixel-button--accent px-8 py-3 text-lg"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="ui-font text-[var(--muted)]">{label}</span>
        <span className="ui-font font-bold text-[var(--ink)]">{value}</span>
      </div>
      <div className="progress-bar mt-1">
        <div
          className="progress-bar__fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}
