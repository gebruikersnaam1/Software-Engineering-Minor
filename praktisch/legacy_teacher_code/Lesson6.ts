import * as Immutable from "immutable"

interface Fun<a, b> {
  f: (_: a) => b
  then: <c>(g: Fun<b, c>) => Fun<a, c>
}

let Fun = <a, b>(f: (_: a) => b): Fun<a, b> => {
  return {
    f: f,
    then: function<c>(g: Fun<b, c>): Fun<a, c> {
      return Fun<a, c>((x: a) => g.f(this.f(x)))
    }
  }
}

type Either<a, b> = {
  kind: "left",
  value: a
} | {
  kind: "right",
  value: b
}

let inl = <a, b>(): Fun<a, Either<a, b>> => {
  return Fun<a, Either<a, b>>((x: a) => {
    return {
    kind: "left",
    value: x
  }})
}

let inr = <a, b>(): Fun<b, Either<a, b>> => {
  return Fun<b, Either<a, b>>((x: b) => {
    return {
    kind: "right",
    value: x
  }})
}

let map_Either = <a, a1, b, b1>(f: Fun<a, a1>, g: Fun<b, b1>): 
  Fun<Either<a, b>, Either<a1, b1>> => {
    return Fun((e: Either<a, b>): Either<a1, b1> => {
      if (e.kind == "left") {
        let newValue = f.f(e.value)
        return inl<a1, b1>().f(newValue)
      }
      else {
        let newValue = g.f(e.value)
        return inr<a1, b1>().f(newValue)
      }
    }) // e.kind == "Left" ? f.then(inl()) : g.then(inr()) 
}

let unit_Either = <a, b>() : Fun<a,Either<b,a>> => inr<b,a>()

let join_Either = <a, b>() : Fun<Either<b,Either<b,a>>, Either<b,a>> =>
  Fun(x => x.kind == "left" ? inl<b,a>().f(x.value)
                : x.value)

type Unit = {}

// (Either Unit) a
type Option<a> = Either<Unit, a>

let id = <a>(): Fun<a, a> => Fun((x: a) => x)

let map_Option = <a, b>(f: Fun<a, b>): Fun<Option<a>, Option<b>> => {
  return map_Either<Unit, Unit, a, b>(id<Unit>(), f)
}

let unit_Option = <a>(): Fun<a, Option<a>> => inr() 

let join_Option = <a>(): Fun<Option<Option<a>>, Option<a>> => {
  return Fun<Option<Option<a>>, Option<a>>((opt: Option<Option<a>>): Option<a> => {
    if (opt.kind == "left") {
      return inl<Unit, a>().f({})
    }
    else {
      return opt.value
    }
  })
}

type Pair<a, b> = {
  fst: a
  snd: b
}

let Pair = <a, b>(x: a, y: b) : Pair<a, b> => {
  return {
    fst: x,
    snd: y
  }
}

let map_Pair = <a, a1, b, b1>(f: Fun<a, a1>, g: Fun<b, b1>): Fun<Pair<a, b>, Pair<a1, b1>> => {
  return Fun((p: Pair<a, b>) => Pair<a1, b1>(f.f(p.fst), g.f(p.snd)))
}

type State<s, a> = Fun<s, Pair<a, s>>

let map_State = <s, a, b>(f: Fun<a, b>): Fun<State<s, a>, State<s, b>> => {
  return Fun((p: State<s, a>) => p.then(map_Pair(f, id<s>())))
}

let unit_State = <s, a>(): Fun<a, State<s, a>> => {
  return Fun((x: a) => {
    return Fun<s, Pair<a, s>>((state: s) => Pair(x, state))
  })
}

let apply = <a, b>(): Fun<Pair<Fun<a, b>, a>, b> => {
  return Fun((p: Pair<Fun<a, b>, a>): b => p.fst.f(p.snd))
}

let join_State = <s, a>(): Fun<State<s, State<s, a>>, State<s, a>> => {
  return Fun((p: State<s, State<s, a>>): State<s, a> => {
    return p.then(apply())
  })
}

let bind_State = <s, a, b>(p: State<s, a>, f: Fun<a, State<s, b>>): State<s, b> => {
  return map_State<s, a, State<s, b>>(f).then(join_State<s, b>()).f(p)
}

let get_State = <s>(): State<s, s> => {
  return Fun<s, Pair<s, s>>((state: s) => Pair(state, state))
}

let set_State = <s>(state: s): State<s, Unit> => {
  return Fun<s, Pair<Unit, s>>((_: s) => Pair({}, state))
}

type Memory = Immutable.Map<string, number>
type Statement<a> = State<Memory, a>

let getVar = (_var: string): Statement<number> => {
  return bind_State(get_State(), Fun((m: Memory) => {
    let m1 = m.get(_var)
    return unit_State<Memory, number>().f(m1)
  }))
}

let setVar = (_var: string, value: number): Statement<Unit> => {
  return bind_State(get_State(), Fun((m: Memory) => {
    let m1 = m.set(_var, value)
    return set_State(m1)
    }))
}



let swap = (var1: string, var2: string): Statement<Unit> => {
  return bind_State(getVar(var1), Fun((v1: number) =>
  bind_State(getVar(var2), Fun((v2: number) =>
  bind_State(setVar(var1, v2), Fun((_: Unit) =>
  setVar(var2, v1)))))))
}

let skip = (): Statement<Unit> => unit_State<Memory, Unit>().f({})

let seq = (current: Statement<Unit>, next: Statement<Unit>): Statement<Unit> =>
  bind_State(current, Fun((_: Unit) => next))

let ifThenElse = (condition: Statement<boolean>, _then: Statement<Unit>, _else: Statement<Unit>): Statement<Unit> => {
  return bind_State(condition, Fun((b: boolean) => {
    if (b) {
      return _then
    }
    else {
      return _else
    }
  }))
}

let _while = (condition: Statement<boolean>, body: Statement<Unit>): Statement<Unit> => {
  return bind_State(condition, Fun((b: boolean) => {
    if (b) {
      return bind_State(body, Fun((_: Unit) => _while(condition, body)))
    }
    else {
      return skip()
    }
  }))
}

let isPositive = (_var: string): Statement<boolean> => {
  return bind_State(getVar(_var), Fun((v: number) =>
  unit_State<Memory, boolean>().f(v > 0)))
}

let decr = (_var : string): Statement<Unit> => {
  return bind_State(getVar(_var), Fun((v: number) => setVar(_var, v - 1)))
}

type Process<s, e, a> = Fun<s, Either<e, Pair<a, s>>>

let map_Process = <s, e, a, b>(f: Fun<a, b>): Fun<Process<s, e, a>, Process<s, e, b>> => {
  return Fun<Process<s, e, a>, Process<s, e, b>>((p: Process<s, e, a>) => 
        p.then(map_Either(id<e>(), map_Pair(f, id<s>()))))
}

let unit_Process = <s, e, a>(): Fun<a, Process<s, e, a>> => {
  return Fun((x: a) => Fun((state: s) => unit_Either<Pair<a, s>, e>().f(Pair<a, s>(x, state))))
}

let join_Process = <s, e, a>(): Fun<Process<s, e, Process<s, e, a>>, Process<s, e, a>> => {
  return Fun<Process<s, e, Process<s, e, a>>, Process<s, e, a>>((p: Process<s, e, Process<s, e, a>>) => {
    return p.then(map_Either(id<e>(), apply())).then(join_Either())
  })
}


let memory = Immutable.Map<string, number>([["x", 5], ["y", 3]])
let testConditional = ifThenElse(isPositive("x"), swap("x", "y"), skip())
let loopBody = seq(decr("x"), seq(decr("y"), skip()))
let testLoop = _while(isPositive("x"), loopBody)
console.log(testLoop.f(memory).snd)
