import { BaseAccessory, CharacteristicConstructor } from "../BaseAccessory";
import { LogLevel } from "homebridge";
import { Characteristic, CharacteristicValue } from "homebridge";

export abstract class TuyaWebCharacteristic<
  Accessory extends BaseAccessory = BaseAccessory,
> {
  public static Title: string;
  public static HomekitCharacteristic: (
    accessory: BaseAccessory,
  ) => CharacteristicConstructor;

  public setProps(characteristic?: Characteristic): Characteristic | undefined {
    return characteristic;
  }

  constructor(protected accessory: Accessory) {
    this.enable();
  }

  private get staticInstance(): typeof TuyaWebCharacteristic {
    return this.constructor as typeof TuyaWebCharacteristic;
  }

  public get title(): string {
    return this.staticInstance.Title;
  }

  public get homekitCharacteristic(): CharacteristicConstructor {
    return this.staticInstance.HomekitCharacteristic(this.accessory);
  }

  private log(logLevel: LogLevel, message: string, ...args: unknown[]): void {
    this.accessory.log.log(
      logLevel,
      `[%s] %s - ${message}`,
      this.accessory.name,
      this.title,
      ...args,
    );
  }

  protected debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  protected info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  protected warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  protected error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Getter called by HomeKit when it requests the current value.
   * Must return a Promise resolving to the HomeKit-compatible value,
   * or reject/throw to signal an error.
   */
  public getRemoteValue?(): Promise<CharacteristicValue>;

  /**
   * Setter called by HomeKit when a value changes.
   * Must return a Promise resolving when the remote update is complete,
   * or reject/throw to signal an error.
   */
  public setRemoteValue?(homekitValue: CharacteristicValue): Promise<void>;

  /**
   * Push-update handler called during cloud polling.
   * Should update the cached HomeKit value via setCharacteristic.
   */
  public updateValue?(data?: Accessory["deviceConfig"]["data"]): void;

  private enable(): void {
    const char = this.setProps(
      this.accessory.service?.getCharacteristic(this.homekitCharacteristic),
    );

    if (char) {
      this.debug(JSON.stringify(char.props));
      if (this.getRemoteValue) {
        char.onGet(this.getRemoteValue.bind(this));
      }

      if (this.setRemoteValue) {
        char.onSet(this.setRemoteValue.bind(this));
      }
    }

    if (this.updateValue) {
      this.accessory.addUpdateCallback(
        this.homekitCharacteristic,
        this.updateValue.bind(this),
      );
    }
  }
}
