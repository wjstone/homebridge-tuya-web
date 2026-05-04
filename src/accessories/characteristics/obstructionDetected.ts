import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState } from "../../api/response";

export class ObstructionDetectedCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.ObstructionDetected";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.ObstructionDetected;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    return false;
  }

  updateValue(_data: DeviceState): void {
    this.debug("Setting obstruction detected to false");
    this.accessory.setCharacteristic(this.homekitCharacteristic, false, true);
  }
}
