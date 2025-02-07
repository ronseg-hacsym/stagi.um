/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is generated using:
 * @fluencelabs/aqua-api version: 0.12.0
 * @fluencelabs/aqua-to-js version: 0.1.0
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 *
 */
import type { IFluenceClient as IFluenceClient$$, CallParams as CallParams$$ } from '@fluencelabs/js-client';

import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
} from '@fluencelabs/js-client';

// Services
export interface StagiumDef {
    explore: (callParams: CallParams$$<null>) => string | Promise<string>;
    isOnlineCheck: (callParams: CallParams$$<null>) => boolean | Promise<boolean>;
    recentGossip: (feedBlock: { author: string; channel: string; source: string; timestamp: number; vector: number[]; title: string; }, callParams: CallParams$$<'feedBlock'>) => boolean | Promise<boolean>;
    train: (callParams: CallParams$$<null>) => boolean | Promise<boolean>;
}
export function registerStagium(service: StagiumDef): void;
export function registerStagium(serviceId: string, service: StagiumDef): void;
export function registerStagium(peer: IFluenceClient$$, service: StagiumDef): void;
export function registerStagium(peer: IFluenceClient$$, serviceId: string, service: StagiumDef): void;
export function registerStagium(...args: any[]) {
    registerService$$(
        args,
        {
    "defaultServiceId": "stagi.um",
    "functions": {
        "fields": {
            "explore": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "string",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "isOnlineCheck": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "bool",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "recentGossip": {
                "domain": {
                    "fields": {
                        "feedBlock": {
                            "name": "FeedBlock",
                            "fields": {
                                "author": {
                                    "name": "string",
                                    "tag": "scalar"
                                },
                                "channel": {
                                    "name": "string",
                                    "tag": "scalar"
                                },
                                "source": {
                                    "name": "string",
                                    "tag": "scalar"
                                },
                                "timestamp": {
                                    "name": "i32",
                                    "tag": "scalar"
                                },
                                "vector": {
                                    "type": {
                                        "name": "i32",
                                        "tag": "scalar"
                                    },
                                    "tag": "array"
                                },
                                "title": {
                                    "name": "string",
                                    "tag": "scalar"
                                }
                            },
                            "tag": "struct"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "bool",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "train": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "bool",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            }
        },
        "tag": "labeledProduct"
    }
}
    );
}


// Functions
export const recentGossip_script = `
(xor
 (seq
  (seq
   (seq
    (seq
     (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
     (call %init_peer_id% ("getDataSrv" "peer") [] -peer-arg-)
    )
    (call %init_peer_id% ("getDataSrv" "feedBlock") [] -feedBlock-arg-)
   )
   (xor
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (call -peer-arg- ("stagi.um" "recentGossip") [-feedBlock-arg-] ret)
     )
     (new $-ephemeral-stream-
      (new #-ephemeral-canon-
       (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
      )
     )
    )
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon %init_peer_id% $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
     )
     (fail :error:)
    )
   )
  )
  (call %init_peer_id% ("callbackSrv" "response") [ret])
 )
 (call %init_peer_id% ("errorHandlingSrv" "error") [:error: 0])
)
`;

export type RecentGossipArgFeedBlock = { author: string; channel: string; source: string; timestamp: number; vector: number[]; title: string; }

export function recentGossip(
    peer: string,
    feedBlock: RecentGossipArgFeedBlock,
    config?: {ttl?: number}
): Promise<boolean>;

export function recentGossip(
    peer: IFluenceClient$$,
    peer: string,
    feedBlock: RecentGossipArgFeedBlock,
    config?: {ttl?: number}
): Promise<boolean>;

export function recentGossip(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "recentGossip",
    "arrow": {
        "domain": {
            "fields": {
                "peer": {
                    "name": "string",
                    "tag": "scalar"
                },
                "feedBlock": {
                    "name": "FeedBlock",
                    "fields": {
                        "author": {
                            "name": "string",
                            "tag": "scalar"
                        },
                        "channel": {
                            "name": "string",
                            "tag": "scalar"
                        },
                        "source": {
                            "name": "string",
                            "tag": "scalar"
                        },
                        "timestamp": {
                            "name": "i32",
                            "tag": "scalar"
                        },
                        "vector": {
                            "type": {
                                "name": "i32",
                                "tag": "scalar"
                            },
                            "tag": "array"
                        },
                        "title": {
                            "name": "string",
                            "tag": "scalar"
                        }
                    },
                    "tag": "struct"
                }
            },
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "name": "bool",
                    "tag": "scalar"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        recentGossip_script
    );
}

export const train_script = `
(xor
 (seq
  (seq
   (seq
    (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
    (call %init_peer_id% ("getDataSrv" "peer") [] -peer-arg-)
   )
   (xor
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (call -peer-arg- ("stagi.um" "train") [] ret)
     )
     (new $-ephemeral-stream-
      (new #-ephemeral-canon-
       (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
      )
     )
    )
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon %init_peer_id% $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
     )
     (fail :error:)
    )
   )
  )
  (call %init_peer_id% ("callbackSrv" "response") [ret])
 )
 (call %init_peer_id% ("errorHandlingSrv" "error") [:error: 0])
)
`;

export function train(
    peer: string,
    config?: {ttl?: number}
): Promise<boolean>;

export function train(
    peer: IFluenceClient$$,
    peer: string,
    config?: {ttl?: number}
): Promise<boolean>;

export function train(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "train",
    "arrow": {
        "domain": {
            "fields": {
                "peer": {
                    "name": "string",
                    "tag": "scalar"
                }
            },
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "name": "bool",
                    "tag": "scalar"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        train_script
    );
}

export const explore_script = `
(xor
 (seq
  (seq
   (seq
    (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
    (call %init_peer_id% ("getDataSrv" "peer") [] -peer-arg-)
   )
   (xor
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (call -peer-arg- ("stagi.um" "explore") [] ret)
     )
     (new $-ephemeral-stream-
      (new #-ephemeral-canon-
       (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
      )
     )
    )
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon %init_peer_id% $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
     )
     (fail :error:)
    )
   )
  )
  (call %init_peer_id% ("callbackSrv" "response") [ret])
 )
 (call %init_peer_id% ("errorHandlingSrv" "error") [:error: 0])
)
`;

export function explore(
    peer: string,
    config?: {ttl?: number}
): Promise<string>;

export function explore(
    peer: IFluenceClient$$,
    peer: string,
    config?: {ttl?: number}
): Promise<string>;

export function explore(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "explore",
    "arrow": {
        "domain": {
            "fields": {
                "peer": {
                    "name": "string",
                    "tag": "scalar"
                }
            },
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "name": "string",
                    "tag": "scalar"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        explore_script
    );
}

export const isOnlineCheck_script = `
(xor
 (seq
  (seq
   (seq
    (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
    (call %init_peer_id% ("getDataSrv" "peer") [] -peer-arg-)
   )
   (xor
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (call -peer-arg- ("stagi.um" "isOnlineCheck") [] ret)
     )
     (new $-ephemeral-stream-
      (new #-ephemeral-canon-
       (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
      )
     )
    )
    (seq
     (seq
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
      (new $-ephemeral-stream-
       (new #-ephemeral-canon-
        (canon %init_peer_id% $-ephemeral-stream-  #-ephemeral-canon-)
       )
      )
     )
     (fail :error:)
    )
   )
  )
  (call %init_peer_id% ("callbackSrv" "response") [ret])
 )
 (call %init_peer_id% ("errorHandlingSrv" "error") [:error: 0])
)
`;

export function isOnlineCheck(
    peer: string,
    config?: {ttl?: number}
): Promise<boolean>;

export function isOnlineCheck(
    peer: IFluenceClient$$,
    peer: string,
    config?: {ttl?: number}
): Promise<boolean>;

export function isOnlineCheck(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "isOnlineCheck",
    "arrow": {
        "domain": {
            "fields": {
                "peer": {
                    "name": "string",
                    "tag": "scalar"
                }
            },
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "name": "bool",
                    "tag": "scalar"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        isOnlineCheck_script
    );
}
