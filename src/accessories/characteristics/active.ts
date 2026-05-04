import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState, ExtendedBoolean } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";

export class ActiveCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.Active";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.Active;
  }

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    return accessory.deviceConfig.data.state !== undefined;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.state);
    if (data?.state !== undefined) {
      const stateValue = TuyaBoolean(data.state as ExtendedBoolean);
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
      return stateValue;
    }
    throw new Error("Could not find required property 'state'");
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    const value = homekitValue ? 1 : 0;
    await this.accessory
      .setDeviceState("turnOnOff", { value }, { state: Boolean(homekitValue) })
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s %s", homekitValue, value);
  }

  updateValue(data: DeviceState): void {
    if (data?.state !== undefined) {
      const stateValue = TuyaBoolean(data.state as ExtendedBoolean);
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
    } else {
      this.error("Could not find required property 'state'");
    }
  }
}
