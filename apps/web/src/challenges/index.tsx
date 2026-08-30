import type { ChallengeMeta } from '../lib/types';

import LocatorGym, { meta as m01 } from './basic/LocatorGym';
import ActionsPlayground, { meta as m02 } from './basic/ActionsPlayground';
import FormValidation, { meta as m03 } from './basic/FormValidation';
import AssertionsZoo, { meta as m04 } from './basic/AssertionsZoo';
import NavigationWizard, { meta as m05 } from './basic/NavigationWizard';
import FirstE2E, { meta as m06 } from './basic/FirstE2E';

import Waits, { meta as m07 } from './intermediate/Waits';
import DynamicContent, { meta as m08 } from './intermediate/DynamicContent';
import Dropdowns, { meta as m09 } from './intermediate/Dropdowns';
import DataTables, { meta as m10 } from './intermediate/DataTables';
import Iframes, { meta as m11 } from './intermediate/Iframes';
import WindowsPopups, { meta as m12 } from './intermediate/WindowsPopups';
import Dialogs, { meta as m13 } from './intermediate/Dialogs';
import DragDrop, { meta as m14 } from './intermediate/DragDrop';
import Files, { meta as m15 } from './intermediate/Files';
import Network, { meta as m16 } from './intermediate/Network';
import Toasts, { meta as m17 } from './intermediate/Toasts';
import Clipboard, { meta as m18 } from './intermediate/Clipboard';

import Auth, { meta as m19 } from './advanced/Auth';
import ApiTesting, { meta as m20 } from './advanced/ApiTesting';
import Mocking, { meta as m21 } from './advanced/Mocking';
import Realtime, { meta as m22 } from './advanced/Realtime';
import ShadowDom, { meta as m23 } from './advanced/ShadowDom';
import Visual, { meta as m24 } from './advanced/Visual';
import Clock, { meta as m25 } from './advanced/Clock';
import Storage, { meta as m26 } from './advanced/Storage';
import Emulation, { meta as m27 } from './advanced/Emulation';
import A11y, { meta as m28 } from './advanced/A11y';
import Flakiness, { meta as m29 } from './advanced/Flakiness';
import Parallelism, { meta as m30 } from './advanced/Parallelism';
import Debugging, { meta as m31 } from './advanced/Debugging';
import Shop, { meta as m32 } from './advanced/Shop';

export const CHALLENGES: ChallengeMeta[] = [
  { ...m01, component: LocatorGym },
  { ...m02, component: ActionsPlayground },
  { ...m03, component: FormValidation },
  { ...m04, component: AssertionsZoo },
  { ...m05, component: NavigationWizard },
  { ...m06, component: FirstE2E },

  { ...m07, component: Waits },
  { ...m08, component: DynamicContent },
  { ...m09, component: Dropdowns },
  { ...m10, component: DataTables },
  { ...m11, component: Iframes },
  { ...m12, component: WindowsPopups },
  { ...m13, component: Dialogs },
  { ...m14, component: DragDrop },
  { ...m15, component: Files },
  { ...m16, component: Network },
  { ...m17, component: Toasts },
  { ...m18, component: Clipboard },

  { ...m19, component: Auth },
  { ...m20, component: ApiTesting },
  { ...m21, component: Mocking },
  { ...m22, component: Realtime },
  { ...m23, component: ShadowDom },
  { ...m24, component: Visual },
  { ...m25, component: Clock },
  { ...m26, component: Storage },
  { ...m27, component: Emulation },
  { ...m28, component: A11y },
  { ...m29, component: Flakiness },
  { ...m30, component: Parallelism },
  { ...m31, component: Debugging },
  { ...m32, component: Shop },
];

export const CHALLENGE_COUNT = CHALLENGES.length;

/** Sanity: routes must be unique. Fail loudly at startup if the registry drifts. */
const paths = new Set(CHALLENGES.map((c) => c.path));
if (paths.size !== CHALLENGES.length) {
  throw new Error('Duplicate challenge route detected in the registry');
}
