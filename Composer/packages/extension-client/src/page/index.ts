// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// TODO: add page plugin APIs here
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export function useSendExtraData(): object {
  if (window['Composer'].publishInfo !== undefined) {
    return window['Composer'].publishInfo;
  } else {
    return { msg: 'No Data' };
  }
}
