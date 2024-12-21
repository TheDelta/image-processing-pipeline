/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, PipelineResult } from "@ipp/common";
import { Operator } from "../lib/stream/object_stream";
import { map } from "../lib/stream/operators/map";
import { isSavedResult, SavedResult } from "./types";

export function saveCallback<T>(
  callback: (result: PipelineResult) => void | Promise<void>,
  callbackDone?: () => void | Promise<void>
): Operator<T | SavedResult, T | SavedResult | Exception> {
  return map<T | SavedResult, T | SavedResult | Exception>(
    async (item) => {
      if (isSavedResult(item)) {
        await Promise.resolve(callback(item.savedResult));
      }

      return item;
    },
    () =>
      new Promise((res) => {
        if (callbackDone) {
          return Promise.resolve(callbackDone()).finally(() => res());
        }
        res();
      })
  );
}
