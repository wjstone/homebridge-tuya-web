import { Characteristic, CharacteristicValue, Formats, Units } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { CoverState, DeviceState, ExtendedBoolean } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";

export class TargetPositionCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.TargetPosition";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.TargetPosition;
  }

  public setProps(char?: Characteristic): Characteristic | undefined {
    return char?.setProps({
      unit: Units.PERCENTAGE,
      format: Formats.INT,
      minValue: 0,
      maxValue: 100,
      minStep: 100,
    });
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.state);
    return this.extractValue(data);
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    const value = (homekitValue as number) === 0 ? 0 : 1;
    const data: DeviceState = {
      target_cover_state: value === 0 ? CoverState.Closing : CoverState.Opening,
      state: value === 0 ? CoverState.Closing : CoverState.Opening,
    };
    await this.accessory
      .setDeviceState("turnOnOff", { value }, data)
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET] %s", value);
  }

  updateValue(data: DeviceState): void {
    try {
      const value = this.extractValue(data);
      this.accessory.setCharacteristic(this.homekitCharacteristic, value, true);
    } catch (error) {
      this.error("%s", (error as Error).message);
    }
  }

  private extractValue(data: DeviceState): CharacteristicValue {
    if (!isNaN(Number(String(data?.state)))) {
      const state = Number(data.state);
      let stateValue: 0 | 50 | 100;
      switch (state) {
        case CoverState.Opening:
          stateValue = 100;
          break;
        case CoverState.Closing:
          stateValue = 0;
          break;
        default:
          if (data.target_cover_state === CoverState.Opening) {
            stateValue = 100;
          } else if (data.target_cover_state === CoverState.Stopped) {
            stateValue = 50;
          } else {
            stateValue = 0;
          }
      }
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
      return stateValue;
    } else if (["true", "false"].includes(String(data?.state).toLowerCase())) {
      const stateValue = TuyaBoolean(data.state as ExtendedBoolean) ? 100 : 0;
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
      return stateValue;
    }
    throw new Error(`Unexpected state value provided: ${data?.state}`);
  }
}
