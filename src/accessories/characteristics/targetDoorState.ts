import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { CoverState, DeviceState, ExtendedBoolean } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";

export class TargetDoorStateCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.TargetDoorState";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.TargetDoorState;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  public get TargetDoorState() {
    return this.accessory.platform.Characteristic.TargetDoorState;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.state);
    return this.extractValue(data);
  }

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    const value = (homekitValue as number) === this.TargetDoorState.CLOSED ? 0 : 1;
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
      let stateValue: 0 | 1 = this.TargetDoorState.OPEN;
      switch (state) {
        case CoverState.Opening:
          stateValue = this.TargetDoorState.OPEN;
          break;
        case CoverState.Closing:
          stateValue = this.TargetDoorState.CLOSED;
          break;
        default:
          if (!isNaN(Number(String(data?.target_cover_state)))) {
            stateValue =
              data.target_cover_state === CoverState.Closing
                ? this.TargetDoorState.CLOSED
                : this.TargetDoorState.OPEN;
          }
      }
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
      return stateValue;
    } else if (["true", "false"].includes(String(data?.state).toLowerCase())) {
      const stateValue = TuyaBoolean(data.state as ExtendedBoolean)
        ? this.TargetDoorState.OPEN
        : this.TargetDoorState.CLOSED;
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
      return stateValue;
    }
    throw new Error(`Unexpected state value provided: ${data?.state}`);
  }
}
