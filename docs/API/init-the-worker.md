# Init the worker

## `initAuthServiceWorker` / `initAuthWebWorker`

Initializes the Auth Worker with the specified providers - within either the service worker or web worker.

### Example

```ts
// service-worker.ts
import { initAuthServiceWorker, initAuthWebWorker } from 'auth-worker/worker';
import { google } from 'auth-worker/providers';

initAuthServiceWorker({ google });
// or
// initAuthWebWorker({ google });
```

Returns `Promise<() => void>`

### Parameters

| Name        | Type                                                                                                                              | Description                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `providers` | `Record<string, IProvider>`                                                                                                       | The providers that should be used.                                       |
| `allowlist` | `Array<RegExp \| string \| { url: RegExp \| string; methods: Array<'GET' \| 'POST' \| 'PATCH' \| 'PUT' \| 'HEAD' \| 'DELETE'> }>` | The allowlist of URLs. Everything is allowed if the array is not passed. |
