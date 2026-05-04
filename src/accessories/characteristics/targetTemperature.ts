import { Characteristic, CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { ClimateAccessory } from "../ClimateAccessory";
import { DeviceState } from "../../api/response";

export class TargetTemperatureCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.TargetTemperature";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.TargetTemperature;
  }

  private get minTemp(): number {
    if (this.accessory.deviceConfig.config?.min_temper) {
      return Number(this.accessory.deviceConfig.config.min_temper);
    }
    const data = this.accessory.deviceConfig.data;
    if (data.min_temper) {
      return (
        Number(data.min_temper) *
        (this.accessory as ClimateAccessory).targetTemperatureFactor
      );
    }
    return 0;
  }

  private get maxTemp(): number {
    if (this.accessory.deviceConfig.config?.max_temper) {
      return Number(this.accessory.deviceConfig.config.max_temper);
    }
    const data = this.accessory.deviceConfig.data;
    if (data.max_temper) {
      return (
        Number(data.max_temper) *
        (this.accessory as ClimateAccessory).targetTemperatureFactor
      );
    }
    return 100;
  }

  public setProps(char?: Characteristic): Characteristic | undefined {
    return char?.setProps({
      minValue: this.minTemp,
      maxValue: this.maxTemp,
      minStep: 0.5,
    });
  }

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    return accessory.deviceConfig.data.temperature !== undefined;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.temperature);
    const temperature = this.computeTemperature(data);
    if (temperature !== undefined) {
      this.accessory.setCharacteristic(this.homekitCharacteristic, temperature, true);
      return temperature;
    }
    throw new Error("Could not get temperature from data");
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    const temperature = Number(homekitValue);
    await this.accessory
      .setDeviceState(
        "temperatureSet",
        { value: temperature },
        {
          temperature:
            temperature /
            (this.accessory as ClimateAccessory).targetTemperatureFactor,
        },
      )
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s %s", homekitValue, temperature);
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
    if (!data?.temperature) return undefined;
    const raw =
      Number(data.temperature) *
      (this.accessory as ClimateAccessory).targetTemperatureFactor;
    return Math.round(raw * 10) / 10;
  }
}
