import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState } from "../../api/response";

export class MomentaryOnCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.MomentaryOn";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.On;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    this.debug("[GET] %s", 0);
    return 0;
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    const value = homekitValue ? 1 : 0;
    if (value === 0) {
      return;
    }
    await this.accessory
      .setDeviceState("turnOnOff", { value }, {})
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s %s", homekitValue, value);
    // Reset back to off after a short delay
    setTimeout(() => {
      this.accessory.service?.setCharacteristic(this.homekitCharacteristic, 0);
    }, 100);
  }

  updateValue(_data: DeviceState): void {
    this.accessory.setCharacteristic(this.homekitCharacteristic, 0, true);
  }
}
