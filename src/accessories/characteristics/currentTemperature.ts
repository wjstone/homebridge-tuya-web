import { Characteristic, CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { ClimateAccessory } from "../ClimateAccessory";
import { DeviceState } from "../../api/response";

export class CurrentTemperatureCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.CurrentTemperature";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.CurrentTemperature;
  }

  public setProps(char?: Characteristic): Characteristic | undefined {
    //Roughly the coldest and hottest temperatures ever recorded on earth.
    return char?.setProps({ minValue: -100, maxValue: 150 });
  }

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    return accessory.deviceConfig.data.current_temperature !== undefined;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.current_temperature);
    const temperature = this.computeTemperature(data);
    if (temperature !== undefined) {
      this.accessory.setCharacteristic(this.homekitCharacteristic, temperature, true);
      return temperature;
    }
    throw new Error("Could not get temperature from data");
  }

  updateValue(data: DeviceState): void {
    const temperature = this.computeTemperature(data);
    if (temperature !== undefined) {
      this.debug("[UPDATE] %s", temperature);
      this.accessory.setCharacteristic(this.homekitCharacteristic, temperature, true);
    } else {
      this.error("Could not get temperature from data");
    }
  }

  private computeTemperature(data: DeviceState): number | undefined {
    if (!data?.current_temperature) return undefined;
    const raw =
      Number(data.current_temperature) *
      (this.accessory as ClimateAccessory).currentTemperatureFactor;
    return Math.round(raw * 10) / 10;
  }
}
