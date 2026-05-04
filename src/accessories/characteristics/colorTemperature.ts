import { Characteristic, CharacteristicValue, Formats } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { MapRange } from "../../helpers/MapRange";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState } from "../../api/response";

// Homekit uses mired light units, Tuya uses kelvin
// Mired = 1.000.000/Kelvin

export class ColorTemperatureCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.ColorTemperature";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.ColorTemperature;
  }

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    return accessory.deviceConfig.data.color_temp !== undefined;
  }

  public setProps(char?: Characteristic): Characteristic | undefined {
    return char?.setProps({
      format: Formats.INT,
      minValue: this.minHomekit,
      maxValue: this.maxHomekit,
    });
  }

  public get minKelvin(): number {
    const data = this.accessory.deviceConfig.config;
    return Number(data?.min_kelvin) || 1000000 / 500;
  }

  public get maxKelvin(): number {
    const data = this.accessory.deviceConfig.config;
    return Number(data?.max_kelvin) || 1000000 / 140;
  }

  public get minHomekit(): number {
    return 1000000 / this.maxKelvin;
  }

  public get maxHomekit(): number {
    return 1000000 / this.minKelvin;
  }

  public rangeMapper = MapRange.tuya(this.maxKelvin, this.minKelvin).homeKit(
    this.minHomekit,
    this.maxHomekit,
  );

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.color_temp);
    if (data?.color_temp !== undefined) {
      const homekitColorTemp = this.toHomekitColorTemp(data);
      this.accessory.setCharacteristic(this.homekitCharacteristic, homekitColorTemp, true);
      return homekitColorTemp;
    }
    throw new Error("Could not find required property 'color_temp'");
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    if (typeof homekitValue !== "number") {
      throw new Error(
        `Received unexpected temperature value ${JSON.stringify(homekitValue)} of type ${typeof homekitValue}`,
      );
    }
    const value = Math.round(this.rangeMapper.homekitToTuya(homekitValue));
    await this.accessory
      .setDeviceState("colorTemperatureSet", { value }, { color_temp: value })
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s %s", homekitValue, value);
  }

  updateValue(data: DeviceState): void {
    if (data?.color_temp !== undefined) {
      const homekitColorTemp = this.toHomekitColorTemp(data);
      this.accessory.setCharacteristic(this.homekitCharacteristic, homekitColorTemp, true);
    } else {
      this.error("Could not find required property 'color_temp'");
    }
  }

  private toHomekitColorTemp(data: DeviceState): number {
    const tuyaValue = data.color_temp;
    const homekitColorTemp = Math.round(
      this.rangeMapper.tuyaToHomekit(Number(data.color_temp)),
    );
    if (homekitColorTemp > this.maxHomekit) {
      this.warn(
        "Characteristic 'ColorTemperature' will receive value higher than allowed mired (%s) since provided Tuya kelvin value (%s) " +
          "is lower than configured minimum Tuya kelvin value (%s). Please update your configuration!",
        homekitColorTemp,
        tuyaValue,
        this.rangeMapper.tuyaStart,
      );
    } else if (homekitColorTemp < this.minHomekit) {
      this.warn(
        "Characteristic 'ColorTemperature' will receive value lower than allowed mired (%s) since provided Tuya kelvin value (%s) " +
          "exceeds configured maximum Tuya kelvin value (%s). Please update your configuration!",
        homekitColorTemp,
        tuyaValue,
        this.rangeMapper.tuyaEnd,
      );
    }
    return homekitColorTemp;
  }
}
