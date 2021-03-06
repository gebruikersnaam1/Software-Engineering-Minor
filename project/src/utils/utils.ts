import {Row} from "../data/models"


/******************************************* 
 * List 
*******************************************/

export type List<a> = {
    kind: "Cons",
    head: a,
    tail: List<a>
} | {
    kind: "Empty"
}

export let Cons = <a>(head:a,tail:List<a>) : List<a> =>({
    kind: "Cons",
    head: head,
    tail: tail
}) 

export let Empty = <a>() : List<a> =>({
    kind: "Empty"
}) 

export let PlusList = function<a>(list1:List<a>,list2:List<a>) : List<a>{
  return list1.kind == "Cons"? Cons(list1.head,PlusList(list1.tail,list2)) : list2
}

/******************************************* 
 * Fun
*******************************************/
export type Fun<a,b> = { 
    f:(i:a) =>b
    then:<c>(x:Fun<b,c>)=> Fun<a,c>
    repeat:(this: Fun<a, a>)=>Fun<number,Fun<a,a>>
    repeatUntil:(this: Fun<a, a>)=>Fun<Fun<a,boolean>,Fun<a,a>>
  }
  
  let then = function<a,b,c>(f:Fun<a,b>,g:Fun<b,c>) : Fun<a,c>{
    return Fun<a,c>((x)=>g.f(f.f(x)))
  }

var repeatUntil = function<a>(f:Fun<a,a>,predict:Fun<a,boolean>) : Fun<a,a>{
    let g = (x:a) =>{ 
      if(predict.f(x)){
        return Identity<a>().f(x) 
      }
      else{
        return f.then(repeatUntil(f,predict)).f(x) 
      }
    }
    return Fun<a,a>(g)
}

let repeat = function<a>(f:Fun<a,a>,n:number) : Fun<a,a>{
  if(n<=0){
    return Identity<a>()
  }else{
    return f.then(repeat(f,(n-1)))
  }
}

export let Identity = <a>(): Fun<a, a> => Fun(x => x)
  
export let Fun = function<a,b>(f:(i:a)=>b) : Fun<a,b>{
    return { 
      f: f,
      then:function<c>(this:Fun<a,b>,g:Fun<b,c>) : Fun<a,c>{
        return then(this,g)
      },
      repeat:function(this): Fun<number,Fun<a,a>>{
        return Fun<number, Fun<a, a>>(n => repeat(this, n))
      },
      repeatUntil:function(this) : Fun<Fun<a,boolean>,Fun<a,a>>{
        return Fun<Fun<a,boolean>,Fun<a,a>>(p => repeatUntil(this,p))
      }
    }
  }
  /******************************************* 
     * join
  *******************************************/

  /******************************************* 
     * map 
  *******************************************/
  export let map_table = <T,U>(l:List<T>,f:Fun<T,Row<U>>) : List<Row<U>> =>{
    return l.kind == "Cons" ? Cons<Row<U>>(f.f(l.head),map_table(l.tail,f)) : Empty<Row<U>>()
  }
  /******************************************* 
     * Other 
  *******************************************/
  export type Unit = {}

  export type Pair<a,b> = {fst:a, snd: b}
  
  export type tableData<T,N> = Pair<List<T>,List<N>>
  export type FilterPair = Pair<string[],string[]>


  export let tableData = <T,N> (dbData: List<T>, newData: List<N>) : tableData<T,N> => ({fst:dbData, snd: newData})
  export let FilterPair = (tabledata: string[], includeData: string[]) : FilterPair => ({fst:tabledata, snd: includeData})

  export let FilterPairUnit = FilterPair([],[])

  export type StringUnit = ""

  export let PrintQueryValues = function<T>(l : List<Row<T>>){
    if(l.kind == "Cons"){
        console.log(l.head.columns.map(x => String(x.value)))
        PrintQueryValues(l.tail)
    }
  }

  export let ConvertArrayStringToNumber = function(stringArray : string[]) : number[]{
    let tmp1 : number[] = []
    stringArray.forEach(e => {
      tmp1.push(Number(e))
    });
    return tmp1
  }
 
  

  export let ConvertStringsToNumber = function(x :string,v: string) : Pair<number, number>{
    return {fst: Number(x),snd:Number(v)}
  }

  export let GetColumnValue =  function(r: Row<Unit>,columnName:string) : string{
    let x : string = ""
    r.columns.map(y =>{
        if(y.name == columnName){
            x = String(y.value)
        }
    })
    return x
}

//only + maybe added other functions later on
export let CalculateNumbers = function(array : number[], operator: "+") : number{
  let tmp1 : number = 0
  array.forEach(e => {
      if(operator == "+"){
        tmp1 += Number(e)
      }
  });
  return tmp1
}

export let GetLowestValue = function(array : number[]) : number{
  let tmp1 : number = array.length != 0 ? array[0] : 0
  array.forEach(e => {
    if (e < tmp1){
      tmp1 = e
    }
  });
  return tmp1
}

export let GetHighestValue = function(array : number[]) : number{
  let tmp1 : number = array.length != 0 ? array[0] : 0
  array.forEach(e => {
    if (e > tmp1){
      tmp1 = e
    }
  });
  return tmp1
}