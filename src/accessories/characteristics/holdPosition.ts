import { CharacteristicValue } from "homebridge";
import { TuyaWebCharacteristic } from "./base";
import { BaseAccessory } from "../BaseAccessory";
import { CoverState } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";

export class HoldPositionCharacteristic extends TuyaWebCharacteristic {
  public static Title = "Characteristic.HoldPosition";

  public static HomekitCharacteristic(accessory: BaseAccessory) {
    return accessory.platform.Characteristic.HoldPosition;
  }

  public static isSupportedByAccessory(accessory: BaseAccessory): boolean {
    return TuyaBoolean(accessory.deviceConfig.data.support_stop);
  }

  public async setRemoteValue(_homekitValue: CharacteristicValue): Promise<void> {
    await this.accessory
      .setDeviceState(
        "startStop",
        { value: 0 },
        { state: CoverState.Stopped, target_cover_state: CoverState.Stopped },
      )
      .catch(this.accessory.handleError("SET"));
    this.debug("[SET]");
  }
}
