/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, sampleMetadata } from "@ipp/common";

import { randomBytes } from "crypto";
import sharp, { OutputInfo, Sharp } from "sharp";

import { SharpPipeOptions, SharpPipe } from "./sharp";

jest.mock("sharp");

type UnPromise<T> = T extends Promise<infer U> ? U : never;

describe("built-in sharp pipe", () => {
  /** The input value */
  const data: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg"),
  };

  /** The return value of the mocked sharp.toBuffer() function */
  const toBufferResult: UnPromise<ReturnType<Sharp["toBuffer"]>> = {
    data: data.buffer,
    info: {
      width: 256,
      height: 256,
      channels: data.metadata.current.channels,
      size: data.buffer.length,
      format: data.metadata.current.format,
      premultiplied: false,
    } as OutputInfo,
  };

  /** The expected value */
  const newData: DataObject = {
    ...data,
    metadata: {
      ...data.metadata,
      current: {
        ...data.metadata.current,
        width: toBufferResult.info.width,
        height: toBufferResult.info.height,
      },
    },
  };

  const toBufferMock = jest.fn(async () => toBufferResult);
  const sharpMock = sharp as unknown as jest.Mock<unknown>;
  let blurMock = jest.fn();
  let flipMock = jest.fn();
  let gammaMock = jest.fn();
  const mocks = [toBufferMock, sharpMock];

  beforeAll(() =>
    sharpMock.mockImplementation(() => {
      const mock = {
        toBuffer: toBufferMock,
        flip: flipMock,
        blur: blurMock,
        gamma: gammaMock,
      };
      flipMock = jest.fn(() => mock);
      mock.flip = flipMock;
      blurMock = jest.fn(() => mock);
      mock.blur = blurMock;
      gammaMock = jest.fn(() => mock);
      mock.gamma = gammaMock;

      return mock;
    })
  );
  afterAll(() => sharpMock.mockRestore());
  afterEach(() => mocks.forEach((m) => m.mockClear()));

  test("execute multiple sharp operations with SharpPipe", async () => {
    const pipeOptions = <SharpPipeOptions>{
      callback: (sharp) => {
        return sharp.blur(5).flip(true);
      },
    };

    const result = SharpPipe(data, pipeOptions);

    await expect(result).resolves.toMatchObject<DataObject>(newData);

    expect(blurMock).toHaveBeenCalledWith(5);
    expect(blurMock).toHaveBeenCalledTimes(1);
    expect(flipMock).toHaveBeenCalledWith(true);
    expect(gammaMock).toHaveBeenCalledTimes(0);
    expect(toBufferMock).toHaveBeenCalledWith({ resolveWithObject: true });
  });

  test("execute multiple sharp operations with SharpPipe", async () => {
    const pipeOptions = <SharpPipeOptions>{
      callback: (sharp) => {
        return sharp.blur(1337).flip(false).gamma(4.57);
      },
    };

    const result = SharpPipe(data, pipeOptions);

    await expect(result).resolves.toMatchObject<DataObject>(newData);

    expect(blurMock).toHaveBeenCalledWith(1337);
    expect(blurMock).toHaveBeenCalledTimes(1);
    expect(flipMock).toHaveBeenCalledWith(false);
    expect(gammaMock).toHaveBeenCalledWith(4.57);
    expect(toBufferMock).toHaveBeenCalledWith({ resolveWithObject: true });
  });
});
