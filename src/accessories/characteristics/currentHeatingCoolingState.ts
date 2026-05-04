import { Characteristic, CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { DeviceState, ExtendedBoolean } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";

export class CurrentHeatingCoolingStateCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.CurrentHeatingCoolingState";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.CurrentHeatingCoolingState;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  public setProps(char?: Characteristic): Characteristic | undefined {
    const data = this.accessory.deviceConfig.data;
    const validValues = [
      this.CurrentHeatingCoolingState.OFF,
      this.CurrentHeatingCoolingState.HEAT,
    ];
    if (data.mode) {
      validValues.push(this.CurrentHeatingCoolingState.COOL);
    }
    return char?.setProps({ validValues });
  }

  private get CurrentHeatingCoolingState() {
    return this.accessory.platform.Characteristic.CurrentHeatingCoolingState;
  }

  public async getRemoteValue(): Promise<CharacteristicValue> {
    const data = await this.accessory
      .getDeviceState()
      .catch(this.accessory.handleError("GET"));
    const d = { state: data.state, mode: data.mode };
    this.debug("[GET] %s", d);
    const value = this.computeValue(d);
    this.accessory.setCharacteristic(this.homekitCharacteristic, value, true);
    return value;
  }

  updateValue(data: DeviceState): void {
    const value = this.computeValue(data);
    this.accessory.setCharacteristic(this.homekitCharacteristic, value, true);
  }

  private computeValue(data: DeviceState): number {
    if (!TuyaBoolean(data?.state as ExtendedBoolean)) {
      this.debug("[UPDATE] %S", "OFF");
      return this.CurrentHeatingCoolingState.OFF;
    }
    const mode = {
      auto: this.CurrentHeatingCoolingState.COOL,
      wind: this.CurrentHeatingCoolingState.COOL,
      hot: this.CurrentHeatingCoolingState.HEAT,
      cold: this.CurrentHeatingCoolingState.COOL,
    }[data?.mode ?? "hot"];
    this.debug(
      "[UPDATE] %s",
      mode === this.CurrentHeatingCoolingState.HEAT ? "HEAT" : "COOL",
    );
    return mode;
  }
}
