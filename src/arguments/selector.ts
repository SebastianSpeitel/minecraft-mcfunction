import { ArgumentObject, Range, rangeToString, NBT, EntityID } from "./";

export enum SelectorTarget {
  nearest = "p",
  random = "r",
  player = "a",
  entity = "e",
  executer = "s"
}

interface SelectorArguments {
  x?: number;
  y?: number;
  z?: number;
  distance?: number;
  dx?: number;
  dy?: number;
  dz?: number;
  scores?: {
    [score: string]: Range;
  };
  team?: {
    [team: string]: boolean;
  };
  limit?: number;
  sort?: "nearest" | "furthest" | "random" | "arbitrary";
  level?: Range;
  gamemode?: {
    spectator?: boolean;
    adventure?: boolean;
    creative?: boolean;
    survival?: boolean;
  };
  name?: {
    [name: string]: boolean;
  };
  x_rotation?: Range;
  y_rotation?: Range;
  type?: {
    [type in EntityID]?: boolean;
  };
  tag?: {
    [tag: string]: boolean;
  };
  nbt?: NBT;
  advancements?: {
    [advancement: string]: boolean | { [criteria: string]: boolean };
  };
  predicate?: {
    [predicate: string]: boolean;
  };
}

function boolanMapToString(map: { [val: string]: boolean }, key: string) {
  return Object.entries<boolean>(map).map(
    ([val, v]) => `${key}=${v ? "" : "!"}${val}`
  );
}

export class Selector extends ArgumentObject {
  public target: SelectorTarget;
  public arguments: SelectorArguments;

  constructor(target: SelectorTarget, args: SelectorArguments = {}) {
    super();
    this.target = target;
    this.arguments = args;
  }

  async *compile() {
    yield `@${this.target}`;

    let pos = 0;
    for (let [arg, val] of Object.entries(this.arguments)) {
      if (pos === 0) yield "[";
      else yield ",";

      switch (arg) {
        case "scores":
          const scores = Object.entries<Range>(val).map(
            ([s, r]) => `${s}=${rangeToString(r)}`
          );
          if (!scores.length) break;
          yield `scores={${scores.join(",")}}`;
          break;
        case "level":
          yield `level=${rangeToString(val)}`;
          break;
        case "team":
        case "gamemode":
        case "name":
        case "type":
        case "tag":
        case "predicate":
          for (let s of boolanMapToString(val, arg)) yield s;
          break;
        case "x_rotation":
        case "y_rotation":
          yield `${arg}=${rangeToString(val)}`;
          break;
        case "advancements":
          type Adv = boolean | { [criteria: string]: boolean };
          const advancements = Object.entries<Adv>(val).map(([adv, v]) => {
            if (typeof v === "boolean") {
              return `${adv}=${v ? "true" : "false"}`;
            }
            const criterias = Object.entries<boolean>(v).map(([c, v]) => {
              return `${c}=${v ? "true" : "false"}`;
            });
            return `${adv}={${criterias.join(",")}}`;
          });
          if (!advancements.length) break;
          yield `advancements={${advancements.join(",")}}`;
          break;
        default:
          yield `${arg}=${val}`;
      }
    }
    if (pos > 0) yield "]";
  }

  toString() {
    const argList: string[] = [];
    for (let [arg, val] of Object.entries(this.arguments)) {
      switch (arg) {
        case "scores":
          const scores = Object.entries<Range>(val).map(
            ([s, r]) => `${s}=${rangeToString(r)}`
          );
          if (!scores.length) break;
          argList.push(`scores={${scores.join(",")}}`);
          break;
        case "level":
          argList.push(`level=${rangeToString(val)}`);
          break;
        case "team":
        case "gamemode":
        case "name":
        case "type":
        case "tag":
        case "predicate":
          argList.push(...boolanMapToString(val, arg));
          break;
        case "x_rotation":
        case "y_rotation":
          argList.push(`${arg}=${rangeToString(val)}`);
          break;
        case "advancements":
          type Adv = boolean | { [criteria: string]: boolean };
          const advancements = Object.entries<Adv>(val).map(([adv, v]) => {
            if (typeof v === "boolean") {
              return `${adv}=${v ? "true" : "false"}`;
            }
            const criterias = Object.entries<boolean>(v).map(([c, v]) => {
              return `${c}=${v ? "true" : "false"}`;
            });
            return `${adv}={${criterias.join(",")}}`;
          });
          if (!advancements.length) break;
          argList.push(`advancements={${advancements.join(",")}}`);
          break;
        default:
          argList.push(`${arg}=${val}`);
      }
    }

    const args = argList.length ? `[${argList.join(",")}]` : "";

    return `@${this.target}${args}`;
  }
}
