import { Memory } from "./types.js";

export type MemoryBuilderFunction<
  Params extends Record<string, any> = {},
  Role extends string = 'user' | 'assistant',
> = (
  builder: MemoryBuilder<Params, Role>,
) => MemoryBuilder<Params, Role> | undefined | null;

export interface MemoryBuilder<Params extends Record<string, any> = {}, Role extends string = 'user' | 'assistant'> {
  message(
    role: Role,
    messageBuilderFunction: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role>;
}

type MemoryBuilderImplMessageDatum<Params extends Record<string, any> = {}, Role extends string = 'user' | 'assistant'> = {
  type: 'message';
  func: (data: Params) => string | undefined | null;
  role: Role;
}

export class MemoryBuilderImpl<Params extends Record<string, any> = {}, Role extends string = 'user' | 'assistant'> implements MemoryBuilder<Params, Role> {
  private memoryData: (
    | MemoryBuilderImplMessageDatum<Params, Role>
  )[];

  constructor() {
    this.memoryData = [];
  }

  message(
    role: Role,
    messageBuilderFunction: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role> {
    this.memoryData.push({
      type: 'message',
      func: messageBuilderFunction,
      role,
    });
    return this;
  }

  build(data: Params): Memory {
    // FIXME
    return {
      type: 'memory',
      contents: [],
    }
  }
}
