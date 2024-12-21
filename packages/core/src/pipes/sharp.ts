/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe } from "@ipp/common";

import produce from "immer";
import sharp, { SharpOptions, Sharp } from "sharp";

sharp.concurrency(1);

export interface SharpPipeOptions {
  options?: SharpOptions;
  callback: (sharp: Sharp) => Promise<Sharp> | Sharp;
}

/**
 * Expose sharp as pipe to do multiple sharp tasks at once
 */
export const SharpPipe: Pipe<SharpPipeOptions> = async (data, options?: SharpPipeOptions) => {
  let sharpInstance = sharp(data.buffer, options?.options);
  if (options?.callback) sharpInstance = await Promise.resolve(options.callback(sharpInstance));

  const {
    data: newBuffer,
    info: { width, height, format, channels },
  } = await sharpInstance.toBuffer({ resolveWithObject: true });

  const newMetadata = produce(data.metadata, (draft) => {
    draft.current.width = width;
    draft.current.height = height;
    draft.current.channels = channels;
    draft.current.format = format;
  });

  return {
    buffer: newBuffer,
    metadata: newMetadata,
  };
};
