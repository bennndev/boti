"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceEnum,
  useViewModelInstanceTrigger,
} from "@rive-app/react-webgl2";
import {
  MASCOT_FILE,
  MASCOT_STATE_MACHINE,
  type MascotHandle,
  type MascotMode,
} from "@/lib/mascot";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

const LABELS: Record<MascotMode, string> = {
  idle: "disponible",
  thinking: "pensando",
  listening: "escuchando",
  working: "trabajando",
  warning: "con una advertencia",
  sleeping: "dormido",
};

interface MascotProps {
  /** Persistent state. Set it to `idle` before firing `success` or `error`. */
  mode?: MascotMode;
  /** Square size in CSS pixels. */
  size?: number;
  className?: string;
  /** Imperative access to the one-shot reactions. */
  ref?: Ref<MascotHandle>;
}

export function Mascot({ mode = "idle", size = 240, className, ref }: MascotProps) {
  const { rive, RiveComponent } = useRive({
    src: MASCOT_FILE,
    stateMachine: MASCOT_STATE_MACHINE,
    autoplay: true,
    autoBind: false,
    layout: LAYOUT,
  });

  const viewModel = useViewModel(rive, { useDefault: true });
  // A fresh instance: the editor-side "Default" instance is not exported with
  // the file, and enum defaults to `idle` anyway.
  const instance = useViewModelInstance(viewModel, { useNew: true, rive });

  const { setValue: setMode } = useViewModelInstanceEnum("mode", instance);
  const { trigger: fireAppear } = useViewModelInstanceTrigger("appear", instance);
  const { trigger: fireSuccess } = useViewModelInstanceTrigger("success", instance);
  const { trigger: fireError } = useViewModelInstanceTrigger("error", instance);

  // Keep the latest setter without making it an effect dependency: the effect
  // must only run when the *prop* changes, never after a one-shot reaction.
  const setModeRef = useRef(setMode);
  useEffect(() => {
    setModeRef.current = setMode;
  }, [setMode]);

  useEffect(() => {
    if (instance) setModeRef.current(mode);
  }, [mode, instance]);

  useImperativeHandle(
    ref,
    () => ({
      success() {
        fireSuccess();
      },
      error() {
        fireError();
      },
      appear() {
        fireAppear();
      },
    }),
    [fireAppear, fireSuccess, fireError],
  );

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Botiquín, ${LABELS[mode]}`}
    >
      <RiveComponent />
    </div>
  );
}
