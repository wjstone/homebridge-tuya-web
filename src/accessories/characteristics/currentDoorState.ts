import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { CoverState, DeviceState, ExtendedBoolean } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";

export class CurrentDoorStateCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.CurrentDoorState";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.CurrentDoorState;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  public get CurrentDoorState() {
    return this.accessory.platform.Characteristic.CurrentDoorState;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    this.debug("[GET] %s", data?.state);
    return this.extractValue(data);
  }

  updateValue(data: DeviceState): void {
    this.debug("Updating value", data);
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
      let stateValue!: number;
      switch (state) {
        case CoverState.Opening:
          stateValue = this.CurrentDoorState.OPENING;
          break;
        case CoverState.Closing:
          stateValue = this.CurrentDoorState.CLOSING;
          break;
        case CoverState.Stopped:
        default:
          if (data.target_cover_state === CoverState.Opening) {
            stateValue = this.CurrentDoorState.OPEN;
          } else if (data.target_cover_state === CoverState.Stopped) {
            stateValue = this.CurrentDoorState.CLOSED;
          } else {
            stateValue = this.CurrentDoorState.STOPPED;
          }
      }
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
      return stateValue;
    } else if (["true", "false"].includes(String(data?.state).toLowerCase())) {
      const stateValue = TuyaBoolean(data.state as ExtendedBoolean)
        ? this.CurrentDoorState.OPEN
        : this.CurrentDoorState.CLOSED;
      this.accessory.setCharacteristic(this.homekitCharacteristic, stateValue, true);
      return stateValue;
    }
    throw new Error(`Unexpected state value provided: ${data?.state}`);
  }
}
