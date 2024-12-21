/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import { formatExecutionTime } from "@ipp/core";
import { CliContext } from "../cli";
import { Operator } from "../lib/stream/object_stream";
import { map } from "../lib/stream/operators/map";
import { isSavedResult } from "./types";

export function generateProcessSummary<T>(ctx: CliContext): Operator<T, T> {
  return map(async (item) => {
    if (isSavedResult(item)) {
      ctx.state.update((state) => {
        if (!state.saveing) state.saveing = { images: [], exceptions: [] };

        const fullpath = item.savedResult.source.metadata.source["fullpath"] as string;
        const hrtime = (item.savedResult.source.metadata.source["hrtime"] as string)
          .split(";")
          .map((v) => parseInt(v, 10)) as [number, number];

        state.saveing.images.push([fullpath, formatExecutionTime(hrtime)]);
      });
    } else if (item instanceof Exception) {
      ctx.state.update((state) => {
        if (!state.saveing) state.saveing = { images: [], exceptions: [] };

        state.saveing.exceptions.push([item.data().fullPath ?? "N/A", item.message]);
      });
    }
    return item;
  });
}
