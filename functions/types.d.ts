interface PagesFunctionContext<Env> {
  request: Request;
  env: Env;
}

type PagesFunction<Env = unknown> = (context: PagesFunctionContext<Env>) => Response | Promise<Response>;
