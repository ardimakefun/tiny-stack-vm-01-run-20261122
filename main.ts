// Tiny stack VM (ISA v1) — v1 baseline, written in this build session.
// Faithful to generator/subject/vm.mjs: 32-bit wrap, stack 256, call stack 64,
// memory 256 words, 10 traps with their own exit codes, 1e6 step limit,
// 65536 output limit. Score is correctness only, so v1 aims at 1,000,000
// on the practice set; size golf comes in later iterations.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function run(p: Uint8Array, inp: Uint8Array): { out: Uint8Array; code: number } {
  const D = new Int32Array(256);
  const C = new Int32Array(64);
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0;
  let cp = 0;
  let pc = 0;
  let ip = 0;
  let steps = 0;
  let olen = 0;
  // Traps throw their exit code; HALT/EXIT return normally.
  const need = (k: number): void => {
    if (sp < k) throw 2;
  };
  const push = (v: number): void => {
    if (sp >= 256) throw 3;
    D[sp++] = v | 0;
  };
  try {
    for (;;) {
      if (steps === 1000000) throw 10;
      if (pc < 0 || pc >= p.length) throw 9;
      const op = p[pc];
      const imm = op === 0x01 ? 1 : op === 0x02 ? 4 : op >= 0x30 && op <= 0x33 ? 2 : 0;
      if (pc + imm >= p.length) throw 9;
      steps++;
      const next = pc + 1 + imm;
      pc = next;
      switch (op) {
        case 0x00:
          return { out: out.slice(0, olen), code: 0 };
        case 0x01:
          push((p[next - 1] << 24) >> 24);
          break;
        case 0x02:
          push(p[next - 4] | (p[next - 3] << 8) | (p[next - 2] << 16) | (p[next - 1] << 24));
          break;
        case 0x03:
          need(1);
          sp--;
          break;
        case 0x04:
          need(1);
          push(D[sp - 1]);
          break;
        case 0x05:
          need(2);
          [D[sp - 1], D[sp - 2]] = [D[sp - 2], D[sp - 1]];
          break;
        case 0x06:
          need(2);
          push(D[sp - 2]);
          break;
        case 0x07: {
          need(3);
          const a = D[sp - 3];
          D[sp - 3] = D[sp - 2];
          D[sp - 2] = D[sp - 1];
          D[sp - 1] = a;
          break;
        }
        case 0x10:
        case 0x11:
        case 0x12:
        case 0x13:
        case 0x14:
        case 0x15:
        case 0x16:
        case 0x18:
        case 0x19:
        case 0x1a:
        case 0x1c:
        case 0x1d:
        case 0x1e:
        case 0x20:
        case 0x21:
        case 0x22: {
          need(2);
          const b = D[sp - 1];
          const a = D[sp - 2];
          let r: number;
          if (op === 0x10) r = (a + b) | 0;
          else if (op === 0x11) r = (a - b) | 0;
          else if (op === 0x12) r = Math.imul(a, b);
          else if (op === 0x13) {
            if (b === 0) throw 4;
            r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
          } else if (op === 0x14) {
            if (b === 0) throw 4;
            r = b === -1 ? 0 : (a % b) | 0;
          } else if (op === 0x15) {
            if (b === 0) throw 4;
            r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
          } else if (op === 0x16) {
            if (b === 0) throw 4;
            r = ((a >>> 0) % (b >>> 0)) | 0;
          } else if (op === 0x18) r = a & b;
          else if (op === 0x19) r = a | b;
          else if (op === 0x1a) r = a ^ b;
          else if (op === 0x1c) r = a << (b & 31);
          else if (op === 0x1d) r = a >> (b & 31);
          else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
          else if (op === 0x20) r = a === b ? 1 : 0;
          else if (op === 0x21) r = a < b ? 1 : 0;
          else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
          sp -= 2;
          D[sp++] = r;
          break;
        }
        case 0x17:
          need(1);
          D[sp - 1] = (-D[sp - 1]) | 0;
          break;
        case 0x1b:
          need(1);
          D[sp - 1] = ~D[sp - 1];
          break;
        case 0x30:
        case 0x31:
        case 0x32: {
          const rel = ((p[next - 2] | (p[next - 1] << 8)) << 16) >> 16;
          let take = true;
          if (op !== 0x30) {
            need(1);
            const v = D[--sp];
            take = op === 0x31 ? v === 0 : v !== 0;
          }
          if (take) pc = next + rel;
          break;
        }
        case 0x33:
          if (cp === 64) throw 7;
          C[cp++] = next;
          pc = p[next - 2] | (p[next - 1] << 8);
          break;
        case 0x34:
          if (cp === 0) throw 8;
          pc = C[--cp];
          break;
        case 0x40:
          need(1);
          if (D[sp - 1] < 0 || D[sp - 1] >= 256) throw 6;
          D[sp - 1] = M[D[sp - 1]];
          break;
        case 0x41: {
          need(2);
          const addr = D[sp - 1];
          if (addr < 0 || addr >= 256) throw 6;
          M[addr] = D[sp - 2];
          sp -= 2;
          break;
        }
        case 0x50: {
          need(1);
          const s = String(D[sp - 1]);
          if (olen + s.length > 65536) throw 11;
          sp--;
          for (let i = 0; i < s.length; i++) out[olen++] = s.charCodeAt(i);
          break;
        }
        case 0x51:
          need(1);
          if (olen + 1 > 65536) throw 11;
          out[olen++] = D[--sp] & 255;
          break;
        case 0x52:
          push(ip < inp.length ? inp[ip++] : -1);
          break;
        case 0x53:
          need(1);
          return { out: out.slice(0, olen), code: D[--sp] & 255 };
        default:
          throw 5;
      }
    }
  } catch (e) {
    return { out: out.slice(0, olen), code: e as number };
  }
}

for (const id of readdirSync(I).sort()) {
  const r = run(
    new Uint8Array(readFileSync(join(I, id, 'program.bin'))),
    new Uint8Array(readFileSync(join(I, id, 'input.bin'))),
  );
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}
