import { Characteristic, CharacteristicValue, Formats, Units } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { MapRange } from "../../helpers/MapRange";
import { DeviceState } from "../../api/response";

export class RotationSpeedCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.RotationSpeed";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.RotationSpeed;
  }

  public range = MapRange.tuya(1, this.maxSpeedLevel).homeKit(
    this.minStep,
    this.maxSpeedLevel * this.minStep,
  );

  public setProps(char?: Characteristic): Characteristic | undefined {
    return char?.setProps({
      unit: Units.PERCENTAGE,
      format: Formats.INT,
      minValue: 0,
      maxValue: 100,
      minStep: this.minStep,
    });
  }

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    return (
      accessory.deviceConfig.data.speed_level !== undefined &&
      accessory.deviceConfig.data.speed !== undefined
    );
  }

  public get maxSpeedLevel(): number {
    const data = this.accessory.deviceConfig.data;
    return Number(data.speed_level) || 1;
  }

  public get minStep(): number {
    return Math.floor(100 / this.maxSpeedLevel);
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.speed);
    if (data?.speed !== undefined) {
      const speed = this.range.tuyaToHomekit(Number(data.speed));
      this.accessory.setCharacteristic(this.homekitCharacteristic, speed, true);
      return speed;
    }
    throw new Error(`Unexpected speed value provided: ${data?.speed}`);
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    let value = this.range.homekitToTuya(Number(homekitValue));
    value = value < 1 ? 1 : value;
    value = value > this.maxSpeedLevel ? this.maxSpeedLevel : value;
    await this.accessory
      .setDeviceState("windSpeedSet", { value }, { speed: value })
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s %s", homekitValue, value);
  }

  updateValue(data: DeviceState): void {
    if (data?.speed !== undefined) {
      const speed = this.range.tuyaToHomekit(Number(data.speed));
      this.accessory.setCharacteristic(this.homekitCharacteristic, speed, true);
    } else {
      this.error(`Unexpected speed value provided: ${data?.speed}`);
    }
  }
}
