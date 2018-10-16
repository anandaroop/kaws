import tracer from "dd-trace"
import { Tags } from "opentracing"
import config from "../config"
import { error, verbose as debug } from "./loggers"

const { DD_TRACER_SERVICE_NAME, DD_TRACER_HOSTNAME, PRODUCTION_ENV } = config

export function init() {
  tracer.init({
    service: DD_TRACER_SERVICE_NAME,
    hostname: DD_TRACER_HOSTNAME,
    plugins: false,
    logger: { debug, error },
    debug: !PRODUCTION_ENV,
  })
  tracer.use("express", {
    service: DD_TRACER_SERVICE_NAME,
    headers: ["User-Agent", "X-User-ID"],
  } as any)
  tracer.use("http", {
    service: `${DD_TRACER_SERVICE_NAME}.http-client`,
  })
  tracer.use("graphql", {
    service: `${DD_TRACER_SERVICE_NAME}.graphql`,
    /**
     * NOTE: This means we capture _all_ variables. When/if needed, we can
     *       use this callback to redact sensitive variables.
     */
    variables: variables => variables,
  } as any)
}

const createCommand = (command: string) => <T>(promise: Promise<T>): Promise<T> => {
  const parentScope = tracer.scopeManager().active()
  const span = tracer.startSpan("memcached", {
    childOf: parentScope && parentScope.span(),
    tags: {
      [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
      [Tags.DB_TYPE]: "memcached",
      "service.name": `${DD_TRACER_SERVICE_NAME}.memcached`,
      "resource.name": command,
      "span.type": "memcached",
    },
  })

  return promise.then(
    result => {
      span.finish()
      return result
    },
    err => {
      const tags = {
        "error.type": err.name,
        "error.msg": err.message,
      }
      if (!err.message.includes("Cache miss")) {
        tags["error.stack"] = err.stack
      }
      span.addTags(tags)
      span.finish()
      throw err
    }
  )
}

export const cacheTracer = {
  get: createCommand("get"),
  set: createCommand("set"),
  delete: createCommand("delete"),
}
