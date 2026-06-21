import { registerWebModule, NativeModule } from 'expo';

class ExpoAppBlockerModule extends NativeModule<{}> {}

export default registerWebModule(ExpoAppBlockerModule, 'ExpoAppBlockerModule');
