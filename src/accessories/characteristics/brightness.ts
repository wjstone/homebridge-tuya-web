import { CharacteristicValue } from "homebridge";
import { COLOR_MODES } from "./index";
import { inspect } from "util";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState } from "../../api/response";
import { MapRange } from "../../helpers/MapRange";

export class BrightnessCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.Brightness";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.Brightness;
  }

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    const configData = accessory.deviceConfig.data;
    return (
      configData.brightness !== undefined ||
      configData.color?.brightness !== undefined
    );
  }

  public static DEFAULT_VALUE = 100;

  public get usesColorBrightness(): boolean {
    const deviceData = this.accessory.deviceConfig.data;
    return (
      deviceData?.color_mode !== undefined &&
      deviceData?.color_mode in COLOR_MODES &&
      deviceData?.color?.brightness !== undefined
    );
  }

  public get rangeMapper(): MapRange {
    let minTuya = 10;
    let maxTuya = 100;
    if (
      this.accessory.deviceConfig.config?.min_brightness !== undefined &&
      this.accessory.deviceConfig.config?.max_brightness !== undefined
    ) {
      minTuya = Number(this.accessory.deviceConfig.config?.min_brightness);
      maxTuya = Number(this.accessory.deviceConfig.config?.max_brightness);
    } else if (this.usesColorBrightness) {
      minTuya = 1;
      maxTuya = 255;
    }

    return MapRange.tuya(minTuya, maxTuya).homeKit(0, 100);
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.brightness ?? data?.color?.brightness);
    const tuyaValue = Number(
      this.usesColorBrightness ? data.color?.brightness : data.brightness,
    );
    const homekitValue = this.rangeMapper.tuyaToHomekit(tuyaValue);
    this.warnIfOutOfRange(homekitValue, tuyaValue);
    if (homekitValue) {
      this.accessory.setCharacteristic(this.homekitCharacteristic, homekitValue, true);
      return homekitValue;
    }
    throw new Error(
      `Tried to get brightness but failed to parse data. \n ${inspect(data)}`,
    );
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    const value = this.rangeMapper.homekitToTuya(Number(homekitValue));
    await this.accessory
      .setDeviceState(
        "brightnessSet",
        { value },
        this.usesColorBrightness
          ? { color: { brightness: String(value) } }
          : { brightness: value },
      )
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s", value);
  }

  updateValue(data: DeviceState): void {
    const tuyaValue = Number(
      this.usesColorBrightness ? data.color?.brightness : data.brightness,
    );
    const homekitValue = this.rangeMapper.tuyaToHomekit(tuyaValue);
    this.warnIfOutOfRange(homekitValue, tuyaValue);
    if (homekitValue) {
      this.accessory.setCharacteristic(this.homekitCharacteristic, homekitValue, true);
    } else {
      this.error(
        `Tried to set brightness but failed to parse data. \n ${inspect(data)}`,
      );
    }
  }

  private warnIfOutOfRange(homekitValue: number, tuyaValue: number): void {
    if (homekitValue > 100) {
      this.warn(
        "Characteristic 'Brightness' will receive value higher than allowed (%s) since provided Tuya value (%s) " +
          "exceeds configured maximum Tuya value (%s). Please update your configuration!",
        homekitValue,
        tuyaValue,
        this.rangeMapper.tuyaEnd,
      );
    } else if (homekitValue < 0) {
      this.warn(
        "Characteristic 'Brightness' will receive value lower than allowed (%s) since provided Tuya value (%s) " +
          "is lower than configured minimum Tuya value (%s). Please update your configuration!",
        homekitValue,
        tuyaValue,
        this.rangeMapper.tuyaStart,
      );
    }
  }
}
