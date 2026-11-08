#!/usr/bin/env node
// Instrumentación de agentes por wrapper. Actor: orquestador/agente. Técnica: eventos JSONL con ids W3C-compatibles.
// No depende de la plataforma de agentes: cualquier agente puede invocarlo desde su flujo o hook.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const DEFAULT_FILE = resolve(process.cwd(), '.observability/agent-events.jsonl');
const SERVICE_NAME = 'agent-runtime';
const ENVIRONMENT = process.env.AGENT_ENVIRONMENT ?? process.env.APP_ENVIRONMENT ?? 'local';
const TRACE_RE = /^[a-f0-9]{32}$/;
const SPAN_RE = /^[a-f0-9]{16}$/;

function hex(bytes) {
  return randomBytes(bytes).toString('hex');
}

function traceId() {
  let value = hex(16);
  while (/^0+$/.test(value)) value = hex(16);
  return value;
}

function spanId() {
  let value = hex(8);
  while (/^0+$/.test(value)) value = hex(8);
  return value;
}

function parseArgs(argv) {
  const args = { _: [], attrs: {}, files: [], evidence: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    const value = next !== undefined && !next.startsWith('--') ? argv[++index] : 'true';
    if (key === 'attr') {
      const [name, ...rest] = value.split('=');
      args.attrs[name] = rest.join('=');
    } else if (key === 'file-changed') {
      args.files.push(value);
    } else if (key === 'evidence') {
      args.evidence.push(value);
    } else {
      args[key] = value;
    }
  }
  return args;
}

function safeId(value, pattern, fallback) {
  if (value && pattern.test(value)) return value;
  return fallback;
}

function buildEvent(args, eventName, ids) {
  const attributes = {
    ...args.attrs,
    ...(args.summary ? { summary: args.summary } : {}),
    ...(args.status ? { status: args.status } : {}),
    ...(args.files.length ? { files_changed: args.files } : {}),
    ...(args.evidence.length ? { evidence: args.evidence } : {})
  };
  const event = {
    timestamp: new Date().toISOString(),
    event_name: eventName,
    trace_id: ids.traceId,
    span_id: ids.spanId,
    session_id: ids.sessionId,
    service_name: SERVICE_NAME,
    environment: ENVIRONMENT,
    severity: args.severity ?? (String(args.status).toLowerCase() === 'failed' ? 'error' : 'info'),
    ...(ids.parentSpanId ? { parent_span_id: ids.parentSpanId } : {}),
    ...(args.agent ? { agent_id: args.agent } : {}),
    ...(args.task ? { task_id: args.task } : {}),
    ...(args.skill ? { skill_id: args.skill } : {}),
    ...(args.workflow ? { workflow_id: args.workflow } : {}),
    attributes
  };
  return event;
}

function writeEvent(event, file) {
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(event)}\n`, 'utf8');
}

function readEvents(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function printReport(file, asJson) {
  const events = readEvents(file);
  const traces = new Map();
  for (const event of events) {
    const current = traces.get(event.trace_id) ?? {
      trace_id: event.trace_id,
      session_id: event.session_id,
      agents: new Set(),
      tasks: new Set(),
      events: 0,
      failures: 0,
      first: event.timestamp,
      last: event.timestamp
    };
    current.events += 1;
    if (event.agent_id) current.agents.add(event.agent_id);
    if (event.task_id) current.tasks.add(event.task_id);
    if (event.severity === 'error' || event.attributes?.status === 'failed') current.failures += 1;
    if (event.timestamp < current.first) current.first = event.timestamp;
    if (event.timestamp > current.last) current.last = event.timestamp;
    traces.set(event.trace_id, current);
  }
  const rows = [...traces.values()].map((trace) => ({
    ...trace,
    agents: [...trace.agents],
    tasks: [...trace.tasks]
  }));
  if (asJson) {
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return;
  }
  if (!rows.length) {
    process.stdout.write(`Sin eventos en ${file}\n`);
    return;
  }
  process.stdout.write(`Trazas de agentes (${file})\n`);
  for (const row of rows) {
    process.stdout.write(`- ${row.trace_id} | eventos=${row.events} | fallos=${row.failures} | agentes=${row.agents.join(',') || '-'} | tareas=${row.tasks.join(',') || '-'} | ${row.first} → ${row.last}\n`);
  }
}

function usage() {
  process.stdout.write(`Uso:
  node scripts/agent-trace.mjs start --agent <id> --task <id> [--workflow <id>] [--summary "..."] [--file <ruta>]
  node scripts/agent-trace.mjs emit --type <evento> --trace <32hex> [--parent <16hex>] [--agent <id>] [--task <id>] [--skill <id>] [--workflow <id>] [--severity info|warn|error] [--attr k=v] [--file-changed <ruta>] [--evidence "..."] [--file <ruta>]
  node scripts/agent-trace.mjs report [--file <ruta>] [--json]

Variables equivalentes: AGENT_TRACE_ID, AGENT_SPAN_ID, AGENT_SESSION_ID, AGENT_ID, AGENT_TASK_ID, AGENT_WORKFLOW_ID, AGENT_TRACE_FILE.
`);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
const file = resolve(args.file ?? process.env.AGENT_TRACE_FILE ?? DEFAULT_FILE);

if (!command || command === 'help' || args.help === 'true') {
  usage();
  process.exit(0);
}

if (command === 'report') {
  printReport(file, args.json === 'true');
  process.exit(0);
}

const sessionId = safeId(args.session ?? process.env.AGENT_SESSION_ID, TRACE_RE, traceId());
const trace = safeId(args.trace ?? process.env.AGENT_TRACE_ID, TRACE_RE, traceId());
const parent = args.parent ?? process.env.AGENT_SPAN_ID;
const ids = {
  traceId: trace,
  spanId: spanId(),
  parentSpanId: safeId(parent, SPAN_RE, undefined),
  sessionId
};

if (command === 'start') {
  if (!args.agent || !args.task) {
    process.stderr.write('start requiere --agent y --task\n');
    process.exit(2);
  }
  const event = buildEvent(args, 'agent.task.started', ids);
  writeEvent(event, file);
  process.stdout.write(`${JSON.stringify(event)}\n`);
  process.exit(0);
}

if (command === 'emit') {
  if (!args.type) {
    process.stderr.write('emit requiere --type\n');
    process.exit(2);
  }
  const event = buildEvent(args, args.type, ids);
  writeEvent(event, file);
  process.stdout.write(`${JSON.stringify(event)}\n`);
  process.exit(0);
}

process.stderr.write(`Comando desconocido: ${command}\n`);
usage();
process.exit(2);
