import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState } from "../../api/response";

export class PositionStateCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.PositionState";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.PositionState;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  private get PositionState() {
    return this.accessory.platform.Characteristic.PositionState;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    this.debug("Setting position state to stopped");
    return this.PositionState.STOPPED;
  }

  updateValue(_data: DeviceState): void {
    this.debug("Setting position state to stopped");
    this.accessory.setCharacteristic(
      this.homekitCharacteristic,
      this.PositionState.STOPPED,
      true,
    );
  }
}
