import type { AntamClient } from "../core/AntamClient";
import { BaseCommandManager } from "./BaseCommandManager";
import { NativeEventName } from "./EventsManager";
import type { CommandType } from "../structure/base/BaseCommand";

export class NativeCommandManager extends BaseCommandManager<CommandType> {
  public readonly handlerName = NativeEventName;

  public constructor(client: AntamClient) {
    super(client);
  }
}
