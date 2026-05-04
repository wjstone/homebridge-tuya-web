import { Characteristic, CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { ClimateMode } from "./index";
import { DeviceState, ExtendedBoolean } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";

export class TargetHeatingCoolingStateCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.TargetHeatingCoolingState";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.TargetHeatingCoolingState;
  }

  public static isSupportedByAccessory(): boolean {
    return true;
  }

  public setProps(char?: Characteristic): Characteristic | undefined {
    const validValues = [
      this.TargetHeatingCoolingState.OFF,
      this.TargetHeatingCoolingState.AUTO,
    ];
    if (this.canSpecifyTarget) {
      validValues.push(
        this.TargetHeatingCoolingState.COOL,
        this.TargetHeatingCoolingState.HEAT,
      );
    }
    return char?.setProps({ validValues });
  }

  public get canSpecifyTarget(): boolean {
    const data = this.accessory.deviceConfig.data;
    return !!data.mode;
  }

  private get TargetHeatingCoolingState() {
    return this.accessory.platform.Characteristic.TargetHeatingCoolingState;
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

  public async setRemoteValue(homekitValue: CharacteristicValue): Promise<void> {
    if (homekitValue === this.TargetHeatingCoolingState.OFF) {
      await this.accessory
        .setDeviceState("turnOnOff", { value: 0 }, { state: false })
        .catch(this.accessory.handleError("SET"));
      this.debug("[SET] %s", homekitValue);
      return;
    }

    const map: Record<number, ClimateMode> = {
      [this.TargetHeatingCoolingState.AUTO]: "auto",
      [this.TargetHeatingCoolingState.HEAT]: "hot",
      [this.TargetHeatingCoolingState.COOL]: "cold",
    };

    const value = map[homekitValue as number];
    await this.accessory
      .setDeviceState("turnOnOff", { value: 1 }, { state: true })
      .catch(this.accessory.handleError("SET"));
    if (this.canSpecifyTarget) {
      await this.accessory
        .setDeviceState("modeSet", { value }, { mode: value })
        .catch(this.accessory.handleError("SET"));
    }
    this.debug("[SET] %s %s", homekitValue, value);
  }

  updateValue(data: DeviceState): void {
    const value = this.computeValue(data);
    this.accessory.setCharacteristic(this.homekitCharacteristic, value, true);
  }

  private computeValue(data: DeviceState): number {
    if (!TuyaBoolean(data?.state as ExtendedBoolean)) {
      this.debug("[UPDATE] %s", "OFF");
      return this.TargetHeatingCoolingState.OFF;
    }
    const mode = {
      auto: this.TargetHeatingCoolingState.AUTO,
      wind: this.TargetHeatingCoolingState.AUTO,
      hot: this.TargetHeatingCoolingState.HEAT,
      cold: this.TargetHeatingCoolingState.COOL,
    }[data?.mode ?? "auto"];
    this.debug(
      "[UPDATE] %s",
      mode === this.TargetHeatingCoolingState.HEAT
        ? "HEAT"
        : mode === this.TargetHeatingCoolingState.COOL
          ? "COOL"
          : "AUTO",
    );
    return mode;
  }
}
