import {
  Memory,
  MemoryBuilder,
  MemoryItem,
  RoleDefault,
} from "../../developer-api/index.js";

type MemoryBuilderImplMessageDatum<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault,
> = {
  type: "message";
  func: (data: Params) => string | undefined | null;
  role: Role;
};

export class MemoryBuilderImpl<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault,
> implements MemoryBuilder<Params, Role>
{
  private memoryData: MemoryBuilderImplMessageDatum<Params, Role>[];

  constructor() {
    this.memoryData = [];
  }

  message(
    role: Role,
    messageBuilderFunction: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role> {
    this.memoryData.push({
      type: "message",
      func: messageBuilderFunction,
      role,
    });
    return this;
  }

  build(data: Params): Memory {
    const contents = this.memoryData
      .map((datum) => {
        const itemContents = datum.func(data);
        return itemContents !== null && itemContents !== undefined
          ? ({
              type: "utterance",
              role: datum.role,
              contents: itemContents,
            } as MemoryItem)
          : null;
      })
      .filter((itemOrNull) => itemOrNull !== null);
    return {
      type: "memory",
      contents,
    };
  }
}
