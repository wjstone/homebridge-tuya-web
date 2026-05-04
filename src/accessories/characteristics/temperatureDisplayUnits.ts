import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState } from "../../api/response";

export class TemperatureDisplayUnitsCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.TemperatureDisplayUnits";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.TemperatureDisplayUnits;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  private get TemperatureDisplayUnits() {
    return this.accessory.platform.Characteristic.TemperatureDisplayUnits;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    return this.TemperatureDisplayUnits.CELSIUS;
  }

  updateValue(_data: DeviceState | undefined): void {
    this.accessory.setCharacteristic(
      this.homekitCharacteristic,
      this.TemperatureDisplayUnits.CELSIUS,
      true,
    );
  }
}
