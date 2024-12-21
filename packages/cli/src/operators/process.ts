/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, Pipeline } from "@ipp/common";
import { executePipeline, formatExecutionTime, logger } from "@ipp/core";
import { promises } from "fs";
import { resolve } from "path";
import { pathMetadata } from "../lib/metadata";
import { Operator } from "../lib/stream/object_stream";
import { mapParallel } from "../lib/stream/operators/map_parallel";
import { CompletedTask, isTaskSource, TaskSource } from "./types";

export function processImages<T>(
  pipeline: Pipeline,
  concurrency: number
): Operator<T | TaskSource, T | CompletedTask | Exception> {
  return mapParallel<T | TaskSource, T | CompletedTask | Exception>(concurrency, async (item) => {
    if (!isTaskSource(item)) return item;

    const { fullPath, initialMeta } = generatePaths(item);
    const buffer = await promises.readFile(fullPath);

    logger.info("Process image %s", fullPath);
    const hrtime = process.hrtime();
    initialMeta["hrtime"] = hrtime.join(";");

    try {
      const result = await executePipeline(pipeline, buffer, initialMeta);
      logger.info(">> Processing of %s took %s", fullPath, formatExecutionTime(hrtime));
      return {
        ...item,
        result,
      };
    } catch (err) {
      logger.error(err);
      if (err instanceof Exception) return err.setAdditionalData({ fullPath });
      return new Exception(`Unexpected processing error: ${(err as Error).message}`)
        .extend(err as Error)
        .setAdditionalData({ fullPath });
    }
  });
}

function generatePaths(item: TaskSource) {
  const relativePath = item.file;
  const fullPath = resolve(item.root, relativePath);
  const initialMeta = pathMetadata(relativePath, fullPath);

  return {
    fullPath,
    initialMeta,
  };
}
