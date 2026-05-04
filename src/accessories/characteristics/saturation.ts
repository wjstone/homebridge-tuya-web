import { CharacteristicValue } from "homebridge";
import { COLOR_MODES } from "./index";
import { TuyaWebCharacteristic } from "./base";
import { ColorAccessory } from "../ColorAccessory";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState } from "../../api/response";

export class SaturationCharacteristic extends TuyaWebCharacteristic<ColorAccessory> {
  public static Title = "Characteristic.Saturation";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.Saturation;
  }

  public static DEFAULT_VALUE = 0;

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    const configData = accessory.deviceConfig.data;
    return configData.color_mode !== undefined;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.color?.saturation);
    const stateValue = this.extractValue(data);
    this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
    return stateValue;
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    const value = homekitValue as number;
    await this.accessory
      .setColor({ saturation: value })
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s", value);
  }

  updateValue(data: DeviceState): void {
    const stateValue = this.extractValue(data);
    this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
  }

  private extractValue(data: DeviceState): number {
    if (
      data?.color_mode !== undefined &&
      data?.color_mode in COLOR_MODES &&
      data?.color?.saturation
    ) {
      return Number(data.color.saturation);
    }
    return SaturationCharacteristic.DEFAULT_VALUE;
  }
}
