/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { normalize, dirname } from "node:path";
import pino from "pino";

export let logger = pino({ level: "silent" });

export type LogLevels = "silent" | "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export function setupLog(logLevel?: LogLevels, outputDir?: string): void {
  const level = logLevel ?? "silent";

  const targets: pino.TransportTargetOptions<unknown>[] = [
    {
      target: "pino-pretty",
      options: { colorize: true, minimumLevel: level },
      level,
    },
  ];

  if (outputDir && level !== "silent") {
    targets.push({
      target: "pino/file",
      options: {
        destination: normalize(dirname(outputDir) + `/${level}-${new Date().getTime()}.log`),
      },
      level,
    });
  }

  const transport = pino.transport({
    targets,
  });

  logger = pino(transport);
  logger.level = level;
  logger.info("Init logger with log level %s", logger.level);
}

export function formatExecutionTime(hrtime: [number, number]) {
  const end = process.hrtime(hrtime);
  return (end[0] > 0 ? `${end[0]}s, ` : "") + (end[1] / 1000000).toFixed(3) + "ms";
}
